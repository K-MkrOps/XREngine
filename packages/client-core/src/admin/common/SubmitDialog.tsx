import React from 'react'
import { useTranslation } from 'react-i18next'

import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'

import styles from '../styles/admin.module.scss'

const FormDialog = () => {
  const [open, setOpen] = React.useState(true)
  const handleClose = () => {
    setOpen(false)
  }
  const { t } = useTranslation()

  return (
    <div>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
        classes={{ paper: styles.paperDialog }}
      >
        <DialogTitle id="form-dialog-title"> {t('admin:components.dialog.notAccess')}</DialogTitle>
        <DialogContent>
          <DialogContentText className={styles.spanNone}>
            {t('admin:components.dialog.askAccessResourceMessage')}
          </DialogContentText>
          <TextField autoFocus id="name" label="Username" type="text" fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} className={styles.spanNone}>
            {t('admin:components.dialog.cancel')}
          </Button>
          <Button onClick={handleClose} className={styles.spanDange}>
            {t('admin:components.dialog.submit')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default FormDialog
