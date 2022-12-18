/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */

import * as http from 'http';
import * as https from 'https';
import * as qs from 'querystring';


async function post(url, data, authToken) {

    const options = {
        method: 'POST',
        headers: {
            'authorization': 'Basic ' + authToken,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 1000, // in ms
    }

    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            if (res.statusCode < 200 || res.statusCode > 299) {
                return reject(new Error(`HTTP status code ${res.statusCode}`))
            }

            const body = []
            res.on('data', (chunk) => body.push(chunk))
            res.on('end', () => {
                const resString = Buffer.concat(body).toString()
                resolve(resString)
            })
        })

        req.on('error', (err) => {
            reject(err)
        })

        req.on('timeout', () => {
            req.destroy()
            reject(new Error('Request time out'))
        })

        req.write(data)
        req.end()
    })
}


export const lambdaHandler = async (event, context) => {
    try {
        let headerToken = process.env.AWS_SESSION_TOKEN;
        let ssmPort = process.env.PARAMETERS_SECRETS_EXTENSION_HTTP_PORT;

        console.log("header token" + headerToken);
        console.log("ssm port" + ssmPort);
        console.log("node debug" + process.env.NODE_DEBUG);

        const options = {
            hostname: 'localhost',
            port: ssmPort,
            path: '/systemsmanager/parameters/get?name=%2Flambda%2Fbasicauth%2Fauthtest&withDecryption=true',
            headers: {
                'X-Aws-Parameters-Secrets-Token': headerToken

            }
        }

        const res = await new Promise(resolve => {
            http.get(options, resolve);
        });

        // A ServerResponse is a readable stream, so you need to use the
        // stream-to-promise pattern to use it with async/await.
        let data = await new Promise((resolve, reject) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('error', err => reject(err));
            res.on('end', () => resolve(data));
        });

        data = JSON.parse(data);
        let authToken = data.Parameter.Value;


        var postData = qs.stringify({
            'grant_type': 'client_credentials',
            'scope': 'transactions/post'
        });

        const tokenResponse = await post('https://anonymoustest1.auth.eu-west-1.amazoncognito.com/oauth2/token', postData, authToken);

        const response = {
            "statusCode": 200,
            "headers": {
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": 0
            },
            "body": tokenResponse,
            "isBase64Encoded": false
        };

        return response;

    }
    catch (err) {
        console.log(err);
        return err;
    }
};