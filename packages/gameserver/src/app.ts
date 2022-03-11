import express, { static as _static, errorHandler, json, rest, urlencoded } from '@feathersjs/express'
import { feathers } from '@feathersjs/feathers'
import socketio from '@feathersjs/socketio'
import AgonesSDK from '@google-cloud/agones-sdk'
import * as k8s from '@kubernetes/client-node'
import compress from 'compression'
import cors from 'cors'
import { EventEmitter } from 'events'
import feathersLogger from 'feathers-logger'
import swagger from 'feathers-swagger'
import sync from 'feathers-sync'
import fs from 'fs'
import helmet from 'helmet'
import path from 'path'
import { register } from 'trace-unhandled'
import winston from 'winston'

import { isDev } from '@xrengine/common/src/utils/isDev'
import { Network } from '@xrengine/engine/src/networking/classes/Network'
import { Application } from '@xrengine/server-core/declarations'
import config from '@xrengine/server-core/src/appconfig'
import logger from '@xrengine/server-core/src/logger'
import sequelize from '@xrengine/server-core/src/sequelize'
import services from '@xrengine/server-core/src/services'
import authentication from '@xrengine/server-core/src/user/authentication'

import channels from './channels'
import { ServerTransportHandler, SocketWebRTCServerTransport } from './SocketWebRTCServerTransport'

register()

export const createApp = (): Application => {
  const emitter = new EventEmitter()

  // Don't remove this comment. It's needed to format import lines nicely.

  // @ts-ignore
  const app = express(feathers()) as Application
  const agonesSDK = new AgonesSDK()

  app.set('nextReadyEmitter', emitter)

  try {
    app.configure(
      swagger({
        docsPath: '/openapi',
        docsJsonPath: '/openapi.json',
        uiIndex: path.join(process.cwd() + '/openapi.html'),
        // TODO: Relate to server config, don't hardcode this here
        specs: {
          info: {
            title: 'XREngine API Surface',
            description: 'APIs for the XREngine application',
            version: '1.0.0'
          },
          schemes: ['https'],
          securityDefinitions: {
            bearer: {
              type: 'apiKey',
              in: 'header',
              name: 'authorization'
            }
          },
          security: [{ bearer: [] }]
        }
      })
    )

    app.set('paginate', config.server.paginate)
    app.set('authentication', config.authentication)

    app.configure(sequelize)

    // Enable security, CORS, compression, favicon and body parsing
    app.use(helmet())
    app.use(
      cors({
        origin: true,
        credentials: true
      })
    )
    app.use(compress())
    app.use(json())
    app.use(urlencoded({ extended: true }))

    // Set up Plugins and providers
    app.configure(rest())
    app.configure(
      socketio(
        {
          serveClient: false,
          pingTimeout: process.env.APP_ENV === 'development' ? 1200000 : 20000,
          cors: {
            origin: [
              'https://' + config.gameserver.clientHost,
              'capacitor://' + config.gameserver.clientHost,
              'ionic://' + config.gameserver.clientHost
            ],
            methods: ['OPTIONS', 'GET', 'POST'],
            allowedHeaders: '*',
            preflightContinue: true,
            credentials: true
          }
        },
        (io) => {
          Network.instance.transportHandler = new ServerTransportHandler()
          app.transport = new SocketWebRTCServerTransport(app)
          app.transport.initialize()
          io.use((socket, next) => {
            console.log('GOT SOCKET IO HANDSHAKE', socket.handshake.query)
            ;(socket as any).feathers.socketQuery = socket.handshake.query
            ;(socket as any).socketQuery = socket.handshake.query
            next()
          })
        }
      )
    )

    if (config.redis.enabled) {
      app.configure(
        sync({
          uri:
            config.redis.password != null && config.redis.password !== ''
              ? `redis://${config.redis.address}:${config.redis.port}?password=${config.redis.password}`
              : `redis://${config.redis.address}:${config.redis.port}`
        })
      )
      app.sync.ready.then(() => {
        logger.info('Feathers-sync started')
      })
    }

    // Configure other middleware (see `middleware/index.js`)
    app.configure(authentication)
    // Set up our services (see `services/index.js`)

    app.configure(feathersLogger(winston))
    app.configure(services)

    if (config.gameserver.mode === 'realtime') {
      const kc = new k8s.KubeConfig()
      kc.loadFromDefault()

      app.k8AgonesClient = kc.makeApiClient(k8s.CustomObjectsApi)
      app.k8DefaultClient = kc.makeApiClient(k8s.CoreV1Api)
      app.k8AppsClient = kc.makeApiClient(k8s.AppsV1Api)
      app.k8BatchClient = kc.makeApiClient(k8s.BatchV1Api)
    }

    if (config.kubernetes.enabled || process.env.APP_ENV === 'development' || config.gameserver.mode === 'local') {
      agonesSDK.connect()
      agonesSDK.ready().catch((err) => {
        console.log(err)
        throw new Error(
          '\x1b[33mError: Agones is not running!. If you are in local development, please run xrengine/scripts/sh start-agones.sh and restart server\x1b[0m'
        )
      })
      app.agonesSDK = agonesSDK
      setInterval(() => agonesSDK.health(), 1000)

      app.configure(channels)
    } else {
      console.warn('Did not create gameserver')
    }

    app.use('/healthcheck', (req, res) => {
      res.sendStatus(200)
    })
  } catch (err) {
    console.log('Server init failure')
    console.log(err)
  }

  app.use(errorHandler({ logger } as any))

  /**
   * When using local dev, to properly test multiple worlds for portals we
   * need to programatically shut down and restart the gameserver process.
   */
  if (isDev && !config.kubernetes.enabled) {
    app.restart = () => {
      require('child_process').spawn('npm', ['run', 'dev'], {
        cwd: process.cwd(),
        stdio: 'inherit'
      })
      process.exit(0)
    }
  }

  return app
}
