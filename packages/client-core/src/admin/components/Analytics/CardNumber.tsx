import React from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import makeStyles from '@mui/styles/makeStyles'

const useStyles = makeStyles({
  root: {
    minWidth: '100%'
  },
  bullet: {
    display: 'inline-block',
    margin: '0 2px',
    transform: 'scale(0.8)'
  },
  title: {
    fontSize: 14
  },
  pos: {
    marginBottom: 12
  },
  label: {
    color: '#f6f8fb'
  }
})

interface Props {
  data: {
    number: number
    label: string
    color1: string
    color2: string
  }
}

const CardNumber = ({ data }: Props) => {
  const classes = useStyles()

  return (
    <Card className={classes.root} style={{ backgroundColor: '#323845' }}>
      <CardContent className="text-center">
        <Typography variant="h3" component="h3" className={classes.label}>
          <span>{data.number}</span>
        </Typography>
        <Typography variant="body2" component="p" className={classes.label}>
          <span>{data.label}</span>
        </Typography>
      </CardContent>
    </Card>
  )
}

export default CardNumber
