# iHoogi Angular Application

Angular conversion of the iHoogi questionnaire management system.

## Features

- Authentication with Supabase
- Questionnaire management
- Response tracking
- Lead management
- Multi-language support (Hebrew/English)
- Tailwind CSS styling

## Setup

```bash
npm install
npm start
```

## Environment Configuration

Environment variables are configured in `src/environments/`:
- `environment.ts` - Development settings
- `environment.prod.ts` - Production settings

## Development

- `npm start` - Start development server (http://localhost:4200)
- `npm run build` - Build for production
- `npm run watch` - Build in watch mode

## Project Structure

- `src/app/core/` - Services, guards, and core functionality
  - `services/` - Supabase and authentication services
  - `guards/` - Route guards for authentication
- `src/app/pages/` - Page components
- `src/app/layout/` - Layout components
- `src/environments/` - Environment configurations

## Additional Resources

For more information on using the Angular CLI, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
