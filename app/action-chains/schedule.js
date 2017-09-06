// @flow
import { bindActionCreators } from 'redux';
import dateFormat from 'dateformat';

import readStore from 'actions/readStore';
import checkSettings from 'actions/checkSettings';
import requestSchedule from 'actions/requestSchedule';
import requestMedia from 'actions/requestMedia';
import cleanMedia from 'actions/cleanMedia';

export default function schedule(payload) {
    return function(dispatch) {
        let chain = {
            // chain global attr
            settings: null,

            //chain promise functions
            readStore: bindActionCreators(readStore, dispatch),
            checkSettings: bindActionCreators(checkSettings, dispatch),
            requestSchedule: bindActionCreators(requestSchedule, dispatch),
            requestMedia: bindActionCreators(requestMedia, dispatch),
            cleanMedia: bindActionCreators(cleanMedia, dispatch)
        };

        return new Promise((resolve, reject) => {
            chain.readStore('settings')
                .then(
                    (settings) => {
                        chain.settings = settings.result;
                        return chain.checkSettings(chain.settings);
                    },
                    (message) => reject(message)
                )
                .then(
                    (settings) => {
                        return chain.requestSchedule({
                            url: settings.serverUrl,
                            id: settings.pointId,
                            date: dateFormat(new Date(), 'yyyymmdd')
                        });
                    },
                    (message) => reject(message)
                )
                .then(
                    (schedule) => {
                        return chain.requestMedia({
                            url: chain.settings.serverUrl,
                            pointId: chain.settings.pointId,
                            date: dateFormat(new Date(), 'yyyymmdd'),
                            backgroundFiles: schedule.backgroundFiles,
                            advertisingFiles: schedule.advertisingFiles
                        });
                    },
                    (message) => reject(message)
                )
                .then(
                    () => {
                        return chain.cleanMedia({
                            pointId: chain.settings.pointId,
                            date: dateFormat(new Date(), 'yyyymmdd')
                        });
                    },
                    (message) => reject(message)
                )
                .then(
                    () => {
                        resolve({
                            settings: chain.settings
                        });
                    },
                    (message) => reject(message)
                );
        });
    }
};
