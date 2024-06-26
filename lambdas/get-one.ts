import { APIGatewayProxyEvent } from 'aws-lambda';
import * as AWS from 'aws-sdk';

const TABLE_NAME = process.env.STORE_TABLE_NAME || '';
const PRIMARY_KEY = process.env.STORE_PRIMARY_KEY || '';

const db = new AWS.DynamoDB.DocumentClient();

export const handler = async (event: APIGatewayProxyEvent): Promise<any> => {
  const requestedItemId = event.pathParameters?.id;
  if (!requestedItemId) {
    return {
      statusCode: 400,
      body: `Error: You are missing the path parameter id`,
    };
  }
  const params = {
    TableName: TABLE_NAME,
    Key: {
      [PRIMARY_KEY]: requestedItemId,
    },
  };

  try {
    const response = await db.get(params).promise();
    if (response.Item) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(response.Item),
      };
    } else {
      return { statusCode: 404 };
    }
  } catch (dbError: any) {
    return { statusCode: 500, body: JSON.stringify(dbError) };
  }
};