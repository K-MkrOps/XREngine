import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ProjectInterface } from '@xrengine/common/src/interfaces/ProjectInterface'

import Cached from '@mui/icons-material/Cached'
import Cross from '@mui/icons-material/Cancel'
import CleaningServicesIcon from '@mui/icons-material/CleaningServices'
import VisibilityIcon from '@mui/icons-material/Visibility'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'

import { PROJECT_PAGE_LIMIT, ProjectService, useProjectState } from '../../../common/services/ProjectService'
import { useAuthState } from '../../../user/services/AuthService'
import ConfirmModel from '../../common/ConfirmModel'
import { GithubAppService, useGithubAppState } from '../../services/GithubAppService'
import styles from './Projects.module.scss'
import UploadProjectModal from './UploadProjectModal'
import ViewProjectFiles from './ViewProjectFiles'

if (!global.setImmediate) {
  global.setImmediate = setTimeout as any
}

const Projects = () => {
  const authState = useAuthState()
  const user = authState.user
  const adminProjectState = useProjectState()
  const adminProjects = adminProjectState.projects
  const adminProjectCount = adminProjects.value.length
  const githubAppState = useGithubAppState()
  const githubAppRepos = githubAppState.repos.value
  const { t } = useTranslation()
  const [projectName, setProjectName] = useState('')
  const [showProjectFiles, setShowProjectFiles] = useState(false)

  const headCell = [
    // { id: 'id', numeric: false, disablePadding: true, label: 'ID' },
    { id: 'name', numeric: false, disablePadding: false, label: t('admin:components.project.name') },
    { id: 'update', numeric: false, disablePadding: true, label: t('admin:components.project.update') },
    { id: 'invalidate', numeric: false, disablePadding: false, label: t('admin:components.project.invalidateCache') },
    { id: 'view', numeric: false, disablePadding: false, label: t('admin:components.project.viewProjectFiles') },
    { id: 'remove', numeric: false, disablePadding: false, label: t('admin:components.project.remove') }
  ]

  function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
    if (b[orderBy] < a[orderBy]) {
      return -1
    }
    if (b[orderBy] > a[orderBy]) {
      return 1
    }
    return 0
  }

  type Order = 'asc' | 'desc'

  interface EnhancedTableProps {
    object: string
    numSelected: number
    onRequestSort: (event: React.MouseEvent<unknown>, property) => void
    onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void
    order: Order
    orderBy: string
    rowCount: number
  }

  function EnhancedTableHead(props: EnhancedTableProps) {
    const { object, order, orderBy, onRequestSort } = props
    const createSortHandler = (property) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property)
    }

    return (
      <TableHead className={styles.thead}>
        <TableRow className={styles.trow}>
          {headCell.map((headCell) => (
            <TableCell
              className={styles.tcell}
              key={headCell.id}
              align="right"
              padding={headCell.disablePadding ? 'none' : 'normal'}
              sortDirection={orderBy === headCell.id ? order : false}
            >
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'asc'}
                onClick={createSortHandler(headCell.id)}
              >
                {headCell.label}
              </TableSortLabel>
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
    )
  }

  const [order, setOrder] = useState<Order>('asc')
  const [orderBy, setOrderBy] = useState<string>('name')
  const [selected, setSelected] = useState<string[]>([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(PROJECT_PAGE_LIMIT)
  const [uploadProjectsModalOpen, setUploadProjectsModalOpen] = useState(false)
  const [selectedProjects, setSelectedProjects] = useState<ProjectInterface[]>([])
  const [dimensions, setDimensions] = useState({
    height: window.innerHeight,
    width: window.innerWidth
  })
  const [popupReuploadConfirmOpen, setPopupReuploadConfirmOpen] = useState(false)
  const [popupInvalidateConfirmOpen, setPopupInvalidateConfirmOpen] = useState(false)
  const [popupRemoveConfirmOpen, setPopupRemoveConfirmOpen] = useState(false)
  const [project, setProject] = useState<ProjectInterface>(null!)

  const handleRequestSort = (event: React.MouseEvent<unknown>, property) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      // const newSelecteds = adminProjects.value.map((n) => n.name)
      // setSelected(newSelecteds)
      // return
    }
    setSelected([])
  }

  // const handlePageChange = (event: unknown, newPage: number) => {
  //   const incDec = page < newPage ? 'increment' : 'decrement'
  //   fetchProjects(incDec)
  //   setPage(newPage)
  // }

  // const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   setRowsPerPage(parseInt(event.target.value, 10))
  //   setPage(0)
  // }

  const onRemoveProject = async () => {
    try {
      if (project) {
        const projectToRemove = adminProjects.value.find((p) => p.name === project?.name)!
        if (projectToRemove) {
          await ProjectService.removeProject(projectToRemove.id)
          handleCloseRemoveModel()
        } else {
          throw Error('Failed to find the project')
        }
      }
    } catch (err) {
      console.log(err)
    }
  }

  const tryReuploadProjects = async () => {
    try {
      if (project) {
        if (!project.repositoryPath && project.name !== 'default-project') return
        const existingProjects = adminProjects.value.find((p) => p.name === project.name)!
        await ProjectService.uploadProject(
          project.name === 'default-project' ? 'default-project' : existingProjects.repositoryPath
        )
      }
    } catch (err) {
      console.log(err)
    }
  }
  const handleInvalidateCache = async () => {
    try {
      setPopupInvalidateConfirmOpen(false)
      await ProjectService.invalidateProjectCache(project.name)
    } catch (err) {
      console.log(err)
    }
  }

  const onOpenUploadModal = () => {
    GithubAppService.fetchGithubAppRepos()
    setUploadProjectsModalOpen(true)
  }

  // useEffect(() => {
  //   fetchTick()
  // }, [])

  useEffect(() => {
    if (user?.id.value != null && adminProjectState.updateNeeded.value === true) {
      ProjectService.fetchProjects()
    }
  }, [adminProjectState.updateNeeded.value])

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

  const handleOpenReuploadConfirmation = (row) => {
    setProject(row)
    setPopupReuploadConfirmOpen(true)
  }

  const handleOpenInvaliateConfirmation = (row) => {
    setProject(row)
    setPopupInvalidateConfirmOpen(true)
  }

  const handleOpenRemoveConfirmation = (row) => {
    setProject(row)
    setPopupRemoveConfirmOpen(true)
  }

  const handleCloseReuploadModel = () => {
    setProject(null!)
    setPopupReuploadConfirmOpen(false)
  }

  const handleCloseInvalidateModel = () => {
    setProject(null!)
    setPopupInvalidateConfirmOpen(false)
  }

  const handleCloseRemoveModel = () => {
    setProject(null!)
    setPopupRemoveConfirmOpen(false)
  }

  const handleViewProject = (name: string) => {
    setProjectName(name)
    setShowProjectFiles(true)
  }

  return (
    <div>
      <Paper className={styles.adminRoot}>
        <Grid container spacing={3} className={styles.marginBottom}>
          <Grid item xs={6}>
            <Button
              className={styles['open-modal']}
              type="button"
              variant="contained"
              color="primary"
              onClick={onOpenUploadModal}
            >
              {t('admin:components.project.addProject')}
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              className={styles['open-modal']}
              type="button"
              variant="contained"
              color="primary"
              onClick={ProjectService.triggerReload}
            >
              {t('admin:components.project.rebuild')}
            </Button>
          </Grid>
        </Grid>
        <TableContainer className={styles.tableContainer}>
          <Table stickyHeader aria-labelledby="tableTitle" size={'medium'} aria-label="enhanced table">
            <EnhancedTableHead
              object={'projects'}
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={adminProjectCount || 0}
            />
            <TableBody>
              {adminProjects.value.map((row) => {
                return (
                  <TableRow
                    hover
                    className={styles.trowHover}
                    style={{ color: 'black !important' }}
                    // onClick={(event) => handleLocationClick(event, row.id.toString())}
                    tabIndex={-1}
                    key={row.name}
                  >
                    <TableCell className={styles.tcell} align="right">
                      {row.name}
                    </TableCell>
                    <TableCell className={styles.tcell} align="right">
                      {user.userRole.value === 'admin' && (
                        <Button
                          className={styles.checkbox}
                          disabled={row.repositoryPath === null && row.name !== 'default-project'}
                          onClick={() => handleOpenReuploadConfirmation(row)}
                          name="stereoscopic"
                          color="primary"
                        >
                          <Cached />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className={styles.tcell} align="right">
                      {user.userRole.value === 'admin' && (
                        <Button
                          className={styles.checkbox}
                          onClick={() => handleOpenInvaliateConfirmation(row)}
                          name="stereoscopic"
                          color="primary"
                        >
                          <CleaningServicesIcon />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className={styles.tcell} align="right">
                      {user.userRole.value === 'admin' && (
                        <Button
                          className={styles.checkbox}
                          onClick={() => handleViewProject(row.name)}
                          name="stereoscopic"
                          color="primary"
                        >
                          <VisibilityIcon />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className={styles.tcell} align="right">
                      {user.userRole.value === 'admin' && (
                        <Button
                          className={styles.checkbox}
                          onClick={() => handleOpenRemoveConfirmation(row)}
                          name="stereoscopic"
                          color="primary"
                        >
                          <Cross />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* <div className={styles.tableFooter}>
          <TablePagination
            rowsPerPageOptions={[PROJECT_PAGE_LIMIT]}
            component="div"
            count={adminProjectCount || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            className={styles.tablePagination}
          />
        </div> */}
        <UploadProjectModal
          repos={githubAppRepos}
          open={uploadProjectsModalOpen}
          handleClose={() => setUploadProjectsModalOpen(false)}
        />
        <ConfirmModel
          popConfirmOpen={popupReuploadConfirmOpen}
          handleCloseModel={handleCloseReuploadModel}
          submit={tryReuploadProjects}
          name={project?.name}
          label={t('admin:components.project.project')}
          type="rebuild"
        />
        <ConfirmModel
          popConfirmOpen={popupInvalidateConfirmOpen}
          handleCloseModel={handleCloseInvalidateModel}
          submit={handleInvalidateCache}
          name={project?.name}
          label={t('admin:components.project.storageProvidersCacheOf')}
          type="invalidates"
        />
        <ConfirmModel
          popConfirmOpen={popupRemoveConfirmOpen}
          handleCloseModel={handleCloseRemoveModel}
          submit={onRemoveProject}
          name={project?.name}
          label={t('admin:components.project.project')}
        />
      </Paper>
      {showProjectFiles && projectName && (
        <ViewProjectFiles name={projectName} open={showProjectFiles} setShowProjectFiles={setShowProjectFiles} />
      )}
    </div>
  )
}

export default Projects
