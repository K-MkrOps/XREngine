import { random } from 'lodash';
import { Dispatch } from 'redux';
import Api from '../../components/editor/Api';
import { dispatchAlertError } from "../alert/service";
import { client } from '../feathers';
import {
  fetchingFeeds,
  feedsRetrieved,
  feedRetrieved,
  feedsFeaturedRetrieved,
  addFeedView,
  addFeed
} from './actions';

export function getFeeds(type : string, limit?: number) {
  return async (dispatch: Dispatch, getState: any): Promise<any> => {
    try {
      dispatch(fetchingFeeds());
      const feedsResults = [];
      if(type && type === 'featured'){
        const feedsResults = await client.service('feed').find({
          query: {
            action: 'featured'
          }
        });
        dispatch(feedsFeaturedRetrieved(feedsResults.data));
      }else{
          const feedsResults = await client.service('feed').find({query: {}});

        dispatch(feedsRetrieved(feedsResults.data));
      }
    } catch(err) {
      console.log(err);
      dispatchAlertError(dispatch, err.message);
    }
  };
}

export function getFeed(feedId: string) {
  return async (dispatch: Dispatch): Promise<any> => {
    try {
      dispatch(fetchingFeeds());
      const feed = await client.service('feed').get(feedId);        
      dispatch(feedRetrieved(feed));
    } catch(err) {
      console.log(err);
      dispatchAlertError(dispatch, err.message);
    }
  };
}

export function addViewToFeed(feedId: string) {
  return async (dispatch: Dispatch): Promise<any> => {
    try {
      await client.service('feed').patch(feedId, {});
      dispatch(addFeedView(feedId));
    } catch(err) {
      console.log(err);
      dispatchAlertError(dispatch, err.message);
    }
  };
}

export function createFeed({title, description, video, preview }: any) {
  return async (dispatch: Dispatch): Promise<any> => {
    try {
      const api = new  Api();
      const storedVideo = await api.upload(video, null);
      const storedPreview = await api.upload(preview, null);
      //@ts-ignore error that this vars are void bacause upload is defines as voin funtion
      if(storedVideo && storedPreview){
        //@ts-ignore error that this vars are void bacause upload is defines as voin funtion
        const feed = await client.service('feed').create({title, description, videoId:storedVideo.file_id, previewId: storedPreview.file_id});
        dispatch(addFeed(feed));
      }      
    } catch(err) {
      console.log(err);
      dispatchAlertError(dispatch, err.message);
    }
  };
}
