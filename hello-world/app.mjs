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

let parameterUrl = "http://localhost:2773/systemsmanager/parameters/get?name=%2Flambda%2Fbasicauth%2Fauthtest"

export const lambdaHandler = async (event, context) => {
    try {
        //useless comment

        let secret = '';
        let headerToken = process.env.AWS_SESSION_TOKEN;
        let ssmPort = process.env.PARAMETERS_SECRETS_EXTENSION_HTTP_PORT;

        console.log("ssm port" + port);
        console.log("header token" + headerToken);

        const options = {
            hostname: 'localhost',
            port: ssmPort,
            path: '/systemsmanager/parameters/get?name=%2Flambda%2Fbasicauth%2Fauthtest',
            headers: {
                'X-Aws-Parameters-Secrets-Token': headerToken
            }
        }

        http.get(options, (resp) => {
            resp.on('data', (chunk) => {
                secret += chunk;
            });
        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });


        console.log("Secret is :" + secret);

        console.log(event);
        console.log(context);

        return event;
    }
    catch (err) {
        console.log(err);
        return err;
    }
};
