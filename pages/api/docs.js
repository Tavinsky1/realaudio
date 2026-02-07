/**
 * API Documentation Page
 * 
 * Serves Swagger UI for interactive API documentation
 * Available at /api/docs
 */

import { createSwaggerSpec } from 'next-swagger-doc';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export const getStaticProps = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'pages/api',
    schemaFolders: ['lib'],
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'AgentWallet Protocol API',
        version: '0.1.0',
        description: 'Infrastructure for autonomous AI agents that pay their own way',
        contact: {
          name: 'Inksky',
          url: 'https://inksky.net',
        },
      },
      servers: [
        {
          url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
          description: 'Current environment',
        },
      ],
    },
  });

  return {
    props: {
      spec,
    },
  };
};

const ApiDocs = ({ spec }) => {
  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto',
      padding: '20px',
      background: '#fafafa',
      minHeight: '100vh'
    }}>
      <SwaggerUI spec={spec} />
    </div>
  );
};

export default ApiDocs;
