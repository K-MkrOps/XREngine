import { createState } from '@speigg/hookstate'
import classNames from 'classnames'
import React, { useEffect, useState } from 'react'

import { useLocationInstanceConnectionState } from '@xrengine/client-core/src/common/services/LocationInstanceConnectionService'
import { ChatService, useChatState } from '@xrengine/client-core/src/social/services/ChatService'
import { getChatMessageSystem, removeMessageSystem } from '@xrengine/client-core/src/social/services/utils/chatSystem'
import { useDispatch } from '@xrengine/client-core/src/store'
import { useAuthState } from '@xrengine/client-core/src/user/services/AuthService'
import { Channel } from '@xrengine/common/src/interfaces/Channel'
import { isCommand } from '@xrengine/engine/src/common/functions/commandHandler'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { createXRUI, XRUI } from '@xrengine/engine/src/xrui/functions/createXRUI'
import { useXRUIState } from '@xrengine/engine/src/xrui/functions/useXRUIState'

import { Close as CloseIcon, Message as MessageIcon, Send } from '@mui/icons-material'
import Avatar from '@mui/material/Avatar'
import Badge from '@mui/material/Badge'
import ListItemAvatar from '@mui/material/ListItemAvatar'

const styles = {
  avatarItem: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: '0',
    width: '40px',
    height: '40px',
    fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
    fontSize: '1.25rem',
    lineHeight: '1',
    borderRadius: '50%',
    overflow: 'hidden',
    userSelect: 'none',
    color: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(189, 189, 189)',
    margin: '0 10px'
  },
  avatar: {
    userSelect: 'none',
    width: '1em',
    height: '1em',
    display: 'inline-block',
    fill: 'currentcolor',
    flexShrink: '0',
    transition: 'fill 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
    fontSize: '1.5rem'
  },
  chatContainer: {
    display: 'grid',
    flexDirection: 'row',
    width: '500px',
    margin: '5px 15px 20px 10px',
    borderRadius: '5px',
    backgroundColor: '#3c3c6f'
  },
  hide: { width: '0', overflow: 'hidden' },
  messageList: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    height: '100%',
    padding: '0px 10px',
    background: 'transparent'
  },
  messageItem: {
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    textDecoration: 'none',
    width: '100%',
    boxSizing: 'border-box',
    paddingTop: '8px',
    paddingBottom: '8px'
  },
  messageEnd: { justifyContent: 'flex-end', textAlign: 'end' },
  messageStart: { justifyContent: 'flex-start', textAlign: 'start' },
  messageRow: { width: '100%', display: 'flex' },
  messageContent: {
    borderRadius: '10px 10px 0 0,flex: 1 1 auto',
    minWidth: '0px',
    marginTop: '4px',
    marginBottom: '4px'
  },
  messageChild: {
    margin: '0px',
    fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
    fontWeight: '400',
    fontSize: '1rem',
    lineHeight: '1.5',
    letterSpacing: '0.00938em',
    display: 'block'
  },
  senderName: {
    color: '#fff',
    fontWeight: '700'
  },
  senderMessage: {
    margin: '0px',
    padding: '0px'
  },
  messageBoxContainer: { borderRadius: '40px', background: 'transparent', boxShadow: 'none', width: '500px' },
  messageInputBox: {
    font: 'inherit',
    letterSpacing: 'inherit',
    padding: '4px 0px 5px',
    border: '0px',
    boxSizing: 'content-box',
    background: 'none',
    height: '1.4375em',
    margin: '10px 10px 5px 10px',
    display: 'block',
    minWidth: '0px',
    width: '100%',
    color: 'white'
  },
  chatButton: {
    margin: '5px 15px 10px 10px',
    alignItems: 'center',
    zIndex: '20',
    borderRadius: '50%',
    color: 'black',
    width: '50px',
    height: '50px',
    fontSize: '20px'
  }
}

export function createChatDetailView() {
  return createXRUI(ChatDetailView, createChatDetailState())
}

function createChatDetailState() {
  return createState({
    chatWindowOpen: false
  })
}

type ChatDetailState = ReturnType<typeof createChatDetailState>

const ChatDetailView = () => {
  const detailState = useXRUIState() as ChatDetailState

  let activeChannel: Channel | null = null
  const messageRef = React.useRef<HTMLInputElement>()
  const user = useAuthState().user
  const chatState = useChatState()
  const channelState = chatState.channels
  const channels = channelState.channels.value
  const [composingMessage, setComposingMessage] = useState('')
  const [unreadMessages, setUnreadMessages] = useState(false)
  const activeChannelMatch = Object.entries(channels).find(([key, channel]) => channel.channelType === 'instance')
  const instanceConnectionState = useLocationInstanceConnectionState()
  if (activeChannelMatch && activeChannelMatch.length > 0) {
    activeChannel = activeChannelMatch[1]
  }

  useEffect(() => {
    if (
      user?.instanceId?.value &&
      instanceConnectionState.instance.id?.value &&
      user?.instanceId?.value !== instanceConnectionState.instance.id?.value
    ) {
      console.warn(
        '[WARNING]: somehow user.instanceId and instanceConnectionState.instance.id, are different when they should be the same'
      )
      console.log(user?.instanceId?.value, instanceConnectionState.instance.id?.value)
    }
    if (
      instanceConnectionState.instance.id?.value &&
      instanceConnectionState.connected.value &&
      !chatState.instanceChannelFetching.value
    ) {
      ChatService.getInstanceChannel()
    }
  }, [
    instanceConnectionState.instance.id?.value,
    instanceConnectionState.connected?.value,
    chatState.instanceChannelFetching.value
  ])

  const handleComposingMessageChange = (event: any): void => {
    const message = event.target.value
    setComposingMessage(message)
  }

  const packageMessage = (): void => {
    if (composingMessage?.length && user.instanceId.value) {
      ChatService.createMessage({
        targetObjectId: user.instanceId.value,
        targetObjectType: 'instance',
        text: composingMessage
      })
      setComposingMessage('')
    }
  }

  //const [chatWindowOpen, setChatWindowOpen] = React.useState(false)
  const [isMultiline, setIsMultiline] = React.useState(false)
  const [cursorPosition, setCursorPosition] = React.useState(0)
  const toggleChatWindow = () => {
    detailState.chatWindowOpen.set(!detailState.chatWindowOpen.value)
    detailState.chatWindowOpen.value && setUnreadMessages(false)
  }
  const [dimensions, setDimensions] = useState({
    height: window.innerHeight,
    width: window.innerWidth
  })

  const getMessageUser = (message): string => {
    let returned = message.sender?.name
    if (message.senderId === user.id.value) returned += ' (you)'
    //returned += ': '
    return returned
  }

  const isMessageSentBySelf = (message): boolean => {
    return message.senderId === user.id.value
  }

  useEffect(() => {
    activeChannel &&
      activeChannel.messages &&
      activeChannel.messages.length > 0 &&
      !detailState.chatWindowOpen.value &&
      setUnreadMessages(true)
  }, [activeChannel?.messages])

  useEffect(() => {
    if (isMultiline) {
      ;(messageRef.current as HTMLInputElement).selectionStart = cursorPosition + 1
    }
  }, [isMultiline])

  useEffect(() => {
    window.addEventListener('resize', handleWindowResize)

    return () => {
      window.removeEventListener('resize', handleWindowResize)
    }
  }, [])

  const handleWindowResize = () => {
    setDimensions({
      height: window.innerHeight,
      width: window.innerWidth
    })
  }

  const getAvatar = (message): any => {
    return (
      dimensions.width > 768 && (
        <ListItemAvatar style={styles.avatarItem as {}}>
          <Avatar src={message.sender?.avatarUrl} style={styles.avatar as {}} />
        </ListItemAvatar>
      )
    )
  }

  return (
    <>
      <div
        style={{
          ...(styles.chatContainer as {}),
          ...((detailState.chatWindowOpen.value ? {} : styles.hide) as {})
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', width: '500px' }}>
          <div style={styles.messageList as {}}>
            {activeChannel &&
              activeChannel.messages &&
              [...activeChannel.messages]
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .slice(
                  activeChannel.messages.length >= 3 ? activeChannel.messages?.length - 3 : 0,
                  activeChannel.messages?.length
                )
                .map((message) => {
                  if (!Engine.isBot && isCommand(message.text)) return undefined
                  const system = getChatMessageSystem(message.text)
                  let chatMessage = message.text

                  if (system !== 'none') {
                    if (Engine.isBot || system === 'jl_system') {
                      chatMessage = removeMessageSystem(message.text)
                    } else {
                      return undefined
                    }
                  }
                  return (
                    <li
                      key={message.id}
                      style={{
                        ...(styles.messageItem as {}),
                        ...((isMessageSentBySelf(message) ? styles.messageEnd : styles.messageStart) as {})
                      }}
                    >
                      <div
                        style={{
                          ...(styles.messageRow as {}),
                          ...((isMessageSentBySelf(message) ? styles.messageEnd : styles.messageStart) as {})
                        }}
                      >
                        {!isMessageSentBySelf(message) && getAvatar(message)}
                        <div style={styles.messageContent}>
                          <span style={styles.messageChild}>
                            <span>
                              <span style={styles.senderName}>{getMessageUser(message)}</span>
                              <p style={styles.senderMessage}>{chatMessage}</p>
                            </span>
                          </span>
                        </div>
                        {isMessageSentBySelf(message) && getAvatar(message)}
                      </div>
                    </li>
                  )
                })}
          </div>
          <div style={styles.messageBoxContainer}>
            <input
              xr-layer=""
              ref={messageRef}
              type="text"
              placeholder={'World Chat...'}
              value={composingMessage}
              onChange={(evt) => handleComposingMessageChange(evt)}
              onClick={() => (messageRef as any)?.current?.focus()}
              style={{
                ...(styles.messageInputBox as {}),
                ...((detailState.chatWindowOpen.value ? {} : styles.hide) as {})
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault()
                  const selectionStart = (e.target as HTMLInputElement).selectionStart
                  setCursorPosition(selectionStart || 0)
                  setComposingMessage(
                    composingMessage.substring(0, selectionStart || 0) +
                      '\n' +
                      composingMessage.substring(selectionStart || 0)
                  )
                  !isMultiline && setIsMultiline(true)
                } else if (e.key === 'Enter' && !e.ctrlKey) {
                  e.preventDefault()
                  packageMessage()
                  isMultiline && setIsMultiline(false)
                  setCursorPosition(0)
                }
              }}
            />
          </div>
        </div>
      </div>
      <div xr-layer="" style={styles.chatButton} onClick={() => toggleChatWindow()}>
        <Badge
          color="primary"
          variant="dot"
          invisible={!unreadMessages}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          {!detailState.chatWindowOpen.value ? <MessageIcon /> : <CloseIcon />}
        </Badge>
      </div>
    </>
  )
}