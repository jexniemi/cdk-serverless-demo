# cdk-serverless-demo

A simple serverless CRUD application using Lambdas, API Gateway and DynamoDB.

Includes API Gateway endpoints and Lambdas for:
- Creating a post
- Getting a post
- Getting all posts
- Updating a post
- Deleting a post

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

Remember to destroy environment using `cdk destroy` when it is no longer used.