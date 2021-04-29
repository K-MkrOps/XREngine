/**
 * @author Gleb Ordinsky <tanya.vykliuk@gmail.com>
 */
import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import {Button, Typography} from '@material-ui/core';
import Modal from '@material-ui/core/Modal';
import { FormControl, InputLabel, Input, FormHelperText } from '@material-ui/core';


interface Props{
    create?: any,
    getTipsAndTricks?: any,
    createTipsAndTricks?: any,
    createTipsAndTricksNew?: any,
    deleteTipsAndTricks?: any,
    update?: any,
    tipsAndTricks?: any,
    getFeeds?: any,
    list?: any
}


const ArMediaConsoleTipsAndTricks = ({ create, list, deleteTipsAndTricks, update }:Props) => {
    var rows = list.map( i => createData(i.title, i.id, i.videoUrl, i.description));

    const useStyles = makeStyles({
        table: {
            minWidth: 650,
        },
        form: {
            display: 'Flex',
            flexDirection: 'column',
            marginLeft: 'auto',
            marginRight: 'auto',
            marginTop: '90px',
            width: 'max-content',
            padding: '60px',
            background: '#fff'
        }
    });
    function createData(title: string, id: string, videoUrl: string, description: string) {
        return { title, id, videoUrl, description };
    }



    const classes = useStyles();

    const [open, setOpen] = React.useState(false);

    const [actiontitle, setTitle] = useState(null);
    const [actionId, setId] = useState(null);
    const [actionVideo, setVideo] = useState(null);
    const [actionDescription, setDescription] = useState(null);


    const handleOpen = (title, id, videoUrl, description) => {
        setOpen(true);
        if(title) setTitle(title);
        if(id) setId(id);
        if(videoUrl) setVideo(videoUrl);
        if(description) setDescription(description);
    };
    const handleClose = () => {
        setOpen(false);
    };
    const handleSubmit = (e:any) =>{
        e.preventDefault();
        // console.log('actionId',actionId)
        if(actionId !== '' && actionId !== null){
            update({ id: actionId, title: actiontitle, videoUrl: actionVideo, description: actionDescription })
            // console.log('update')
        }else{
            create({ title: actiontitle, description: actionDescription, videoUrl: actionVideo })
        }
        // console.log({ title: actiontitle, description: actionDescription, videoUrl: actionVideo })
        setOpen(false);
        setTitle('');
        setId('');
        setVideo('');
        setDescription('');
    };

    return (
        <div>
            <Typography variant="h2" color="primary">ARC Tips & Tricks List </Typography>
            <Button onClick={()=>{handleOpen('', '', '', '')}}  variant="outlined" color="secondary" >
                Create
            </Button>

            <TableContainer component={Paper}>
                <Table className={classes.table} size="small" aria-label="a dense table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell align="right">Id</TableCell>
                            <TableCell align="right">Video</TableCell>
                            <TableCell align="right">Description</TableCell>
                        </TableRow>
                    </TableHead>
                    {rows && rows.length > 0 && <TableBody>
                        {rows.map((row) => (
                          <TableRow key={row.title}>
                              <TableCell component="th" scope="row">{row.title}</TableCell>
                              <TableCell align="right">{row.id}</TableCell>
                              <TableCell align="right">{row.videoUrl}</TableCell>
                              <TableCell align="right">{row.description}</TableCell>
                              <TableCell align="right">
                                  <Button onClick={() => handleOpen(row.title, row.id, row.videoUrl, row.description)}>
                                      Edit
                                  </Button>
                              </TableCell>
                              <TableCell align="right">
                                  <Button onClick={() => deleteTipsAndTricks(row.id)}>
                                      Delete
                                  </Button>
                              </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>}
                </Table>
            </TableContainer>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="simple-modal-title"
                aria-describedby="simple-modal-description"
            >
                <div>
                    <form
                        className={classes.form}
                        noValidate
                        onSubmit={(e) => handleSubmit(e)}
                    >
                        <FormControl>
                            <InputLabel htmlFor="tips-and-tricks-title">Title</InputLabel>
                            <Input value={actiontitle ? actiontitle : ""}
                                   onChange={(e)=>setTitle(e.target.value)}
                                   id="tips-and-tricks-title" type='text'
                                   aria-describedby="my-helper-text" />
                            <FormHelperText id="my-helper-text">Tip&Trick Title.</FormHelperText>
                        </FormControl>
                        <input
                            value={actionId ? actionId : ""}
                            onChange={(e)=>setId(e.target.value)}
                            id="tips-and-tricks-id"
                            type="number"
                            hidden
                        />
                        <Button
                            variant="contained"
                            component="label"
                        >
                            Upload File
                            <input

                                onChange={(e)=>setVideo(e.target.files[0])}
                                id="tips-and-tricks-video"
                                type="file"
                                hidden
                            />
                        </Button>
                        {/*<FormControl>*/}
                        {/*    <InputLabel htmlFor="tips-and-tricks-video">Title</InputLabel>*/}
                        {/*    <Input onChange={(e)=>setVideo(e.target.value)}*/}
                        {/*           id="tips-and-tricks-video"*/}
                        {/*           type="text"*/}
                        {/*           value={actionVideo ? actionVideo : ''}*/}
                        {/*           aria-describedby="my-helper-text" />*/}
                        {/*    <FormHelperText id="my-helper-text">Tip&Trick Title.</FormHelperText>*/}
                        {/*</FormControl>*/}

                        <FormControl>
                            <InputLabel htmlFor="tips-and-tricks-description">Description</InputLabel>
                            <Input value={actionDescription ? actionDescription : ""}
                                   onChange={(e)=>setDescription(e.target.value)}
                                   id="tips-and-tricks-description"
                                   type='text' aria-describedby="my-helper-text" />
                            <FormHelperText id="my-helper-text">Tip&Trick short description.</FormHelperText>
                        </FormControl>
                        <Button
                            variant="contained"
                            color="primary"
                            type="submit"
                        >
                            Save
                        </Button>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={()=>handleClose()}
                        >
                            Close
                        </Button>
                    </form>
                </div>
            </Modal>
        </div>
    );
};


export default ArMediaConsoleTipsAndTricks;