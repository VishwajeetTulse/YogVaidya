declare module "swagger-ui-react" {
  interface SwaggerUIProps {
    spec?: Record<string, unknown>;
    url?: string;
    urls?: Array<{ url: string; name: string }>;
    persistAuthorization?: boolean;
    defaultModelsExpandDepth?: number;
    onComplete?: (system: unknown) => void;
    onFailure?: (error: unknown) => void;
    presets?: unknown[];
    plugins?: unknown[];
    layout?: string;
    [key: string]: unknown;
  }

  const SwaggerUI: React.FC<SwaggerUIProps>;
  export default SwaggerUI;
}

declare module "swagger-ui-react/swagger-ui.css" {
  const content: string;
  export default content;
}
