
import * as AWS from 'aws-sdk';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';


const TABLE_NAME = process.env.STORE_TABLE_NAME || '';
const PRIMARY_KEY = process.env.STORE_PRIMARY_KEY || '';
const db = new AWS.DynamoDB.DocumentClient();
const RESERVED_RESPONSE = `Error: You're using AWS reserved keywords as attributes`;
const DYNAMODB_EXECUTION_ERROR = `Error: Execution update, caused a Dynamodb error, please take a look at your CloudWatch Logs.`;

export const handler = async (event: APIGatewayProxyEvent): Promise<any> => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: 'invalid request, you are missing the parameter body'
    };
  }
  const item = typeof event.body == 'object' ? event.body : JSON.parse(event.body);
  item[PRIMARY_KEY] = uuidv4();
  const params = {
    TableName: TABLE_NAME,
    Item: item
  };
  try {
    await db.put(params).promise();
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(item)
    };
  } catch (dbError: any) {
    const errorResponse = dbError.code === 'ValidationException' && dbError.message.includes('reserved keyword') ?
      DYNAMODB_EXECUTION_ERROR : RESERVED_RESPONSE;
    return {
      statusCode: 500,
      body: errorResponse
    };
  }
};