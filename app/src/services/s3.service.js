const logger = require('logger');
const AWS = require('aws-sdk');
const fs = require('fs');
const config = require('config');
const uuidV4 = require('uuid/v4');
const moment = require('moment')

AWS.config.update({
    accessKeyId: config.get('s3.accessKeyId'),
    secretAccessKey: config.get('s3.secretAccessKey')
});

class S3Service {

    constructor() {
        this.s3 = new AWS.S3();
    }

    static getExtension(name) {
        const parts = name.split('.');
        return parts[parts.length - 1];
    }

    async uploadFile(filePath, name) {
        logger.info(`Uploading file ${filePath}`);
        const ext = S3Service.getExtension(name);
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    reject(err);
                }
                const uuid = uuidV4();
                const base64data = new Buffer(data, 'binary');
                this.s3.upload({
                    Bucket: config.get('s3.bucket'),
                    Key: `${config.get('s3.folder')}/${uuid}.${ext}`,
                    Body: base64data,
                    ACL: 'public-read'
                }, (resp) => {
                    if (resp && resp.statusCode >= 300) {
                        logger.error(resp);
                        reject(resp);
                        return;
                    }
                    logger.debug('File uploaded successfully', resp);
                    resolve(`https://s3.amazonaws.com/${config.get('s3.bucket')}/${config.get('s3.folder')}/${uuid}.${ext}`);
                });
            });
        });
    }

    async uploadJson(data) {
        logger.info(`Uploading file json`);
        return new Promise((resolve, reject) => {
            //bucket = gfw-pipelines/
            //key = tiggers/emr/aoi/<yyyymmdd>
            const date = moment().format("YYYYMMDD");
            this.s3.upload({
                Bucket: config.get('s3.bucket'),
                Key: `${config.get('s3.folder')}/${date}.json`,
                Body: data,
                ACL: 'public-read'
            }, (resp) => {
                if (resp && resp.statusCode >= 300) {
                    logger.error(resp);
                    reject(resp);
                    return;
                }
                logger.debug('File uploaded successfully', resp);
                resolve(`https://s3.amazonaws.com/${config.get('s3.bucket')}/${config.get('s3.folder')}/${date}.json`);
            });
        });
    }
}

module.exports = new S3Service();
