import * as cdk from 'aws-cdk-lib';
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, BillingMode, Table, TableClass } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { join } from 'path';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkDemoAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // In deployment environment we generate API keys
    // const apiKey = new ApiKey(this, 'ApiKey');

    const api = new RestApi(this, 'cdk-demo-api', {
      restApiName: 'demo-api',
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      }
      // apiKeySourceType: ApiKeySourceType.HEADER,
    });

    const postsTable = new Table(this, 'cdk-demo-db', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      tableName: 'posts-cdk-demo',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
      tableClass: TableClass.STANDARD_INFREQUENT_ACCESS
    });


    const nodejsProps: NodejsFunctionProps = {
      depsLockFilePath: join(__dirname, '..', 'package-lock.json'),
      environment: {
        STORE_PRIMARY_KEY: 'id', // we're able to reference it in our lambda function with process.env
        STORE_TABLE_NAME: postsTable.tableName,
      }
    };

    const getOneLambda = new NodejsFunction(this, 'getOneStoreFunction', {
      entry: join(__dirname, '../lambdas', 'get-one.ts'),
      ...nodejsProps,
    });
    const getAllLambda = new NodejsFunction(this, 'getAllStoresFunction', {
      entry: join(__dirname, '../lambdas', 'get-all.ts'),
      ...nodejsProps,
    });

    const createOneLambda = new NodejsFunction(this, 'createStoreFunction', {
      entry: join(__dirname, '../lambdas', 'create.ts'),
      ...nodejsProps,
    });

    const updateOneLambda = new NodejsFunction(this, 'updateStoreFunction', {
      entry: join(__dirname, '../lambdas', 'update-one.ts'),
      ...nodejsProps,
    });

    const deleteOneLambda = new NodejsFunction(this, 'deleteStoreFunction', {
      entry: join(__dirname, '../lambdas', 'delete-one.ts'),
      ...nodejsProps,
    });

    // Grant Lambdas read & write access to DynamoDB
    [createOneLambda, getAllLambda, getOneLambda, updateOneLambda, deleteOneLambda]
      .forEach(i => postsTable.grantReadWriteData(i));


    // API Gateway Lambda integrations
    const getAllIntegration = new LambdaIntegration(getAllLambda, { proxy: true });
    const createOneIntegration = new LambdaIntegration(createOneLambda, { proxy: true });
    const getOneIntegration = new LambdaIntegration(getOneLambda, { proxy: true });
    const updateOneIntegration = new LambdaIntegration(updateOneLambda, { proxy: true });
    const deleteOneIntegration = new LambdaIntegration(deleteOneLambda, { proxy: true });

    // Create API Gateway /posts resource
    const posts = api.root.addResource('posts');
    // Methods for handling multiple posts
    posts.addMethod('POST', createOneIntegration);
    posts.addMethod('GET', getAllIntegration);

    // Resource & methods for handling single posts /posts/{id}
    const singlePosts = posts.addResource('{id}');
    singlePosts.addMethod('GET', getOneIntegration);
    singlePosts.addMethod('PATCH', updateOneIntegration);
    singlePosts.addMethod('DELETE', deleteOneIntegration);

    // Print API url in console after creation
    new cdk.CfnOutput(this, 'apiUrl', {value: api.url});
  }
}
