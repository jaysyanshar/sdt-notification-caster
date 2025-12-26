import swaggerJSDoc from 'swagger-jsdoc';
import type { Options as SwaggerJsdocOptions } from 'swagger-jsdoc';

/**
 * OpenAPI spec generator.
 *
 * The spec is generated from JSDoc annotations in route files.
 * This keeps Swagger wiring lightweight and avoids runtime dependencies
 * on particular validation libraries.
 */
export function createOpenApiSpec() {
  const options: SwaggerJsdocOptions = {
    definition: {
      openapi: '3.0.3',
      info: {
        title: 'Notification Caster API',
        version: '1.0.0',
        description:
          'Service that manages users and schedules birthday greeting emails at 09:00 in each user\'s local timezone.',
      },
      servers: [{ url: '/' }],
      tags: [{ name: 'User', description: 'User management' }],
      components: {
        schemas: {
          ApiResponse: {
            type: 'object',
            required: ['code', 'message', 'serverTime'],
            properties: {
              code: { type: 'string', example: 'SUCCESS' },
              message: { type: 'string', example: 'Success' },
              data: { nullable: true },
              serverTime: { type: 'string', format: 'date-time' },
            },
          },
          UserInput: {
            type: 'object',
            required: ['firstName', 'lastName', 'email', 'birthDate', 'timezone'],
            properties: {
              firstName: { type: 'string', example: 'John' },
              lastName: { type: 'string', example: 'Doe' },
              email: { type: 'string', format: 'email', example: 'john@example.com' },
              birthDate: {
                type: 'string',
                example: '1990-05-02',
                description: 'ISO date (YYYY-MM-DD)',
              },
              timezone: {
                type: 'string',
                example: 'Asia/Jakarta',
                description: 'IANA timezone name (e.g., America/New_York)',
              },
            },
          },
          User: {
            allOf: [
              { $ref: '#/components/schemas/UserInput' },
              {
                type: 'object',
                required: ['id', 'createdAt', 'updatedAt'],
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            ],
          },
          ErrorResponse: {
            type: 'object',
            required: ['code', 'message', 'serverTime'],
            properties: {
              code: { type: 'string', example: 'ERROR' },
              message: { type: 'string', example: 'Validation failed' },
              serverTime: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    apis: ['src/modules/**/*.routes.ts'],
  };

  return swaggerJSDoc(options);
}
