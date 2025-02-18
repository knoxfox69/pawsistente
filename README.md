# TikTok-Style SvelteKit 5 Application

A modern, performant social media application built with SvelteKit 5, featuring a TikTok-inspired UI and vertical scrolling experience.

## License

This project is licensed under a proprietary license with open-source non-commercial use permissions. See the [LICENSE](LICENSE) file for details.

## Features

- 📱 Full-screen vertical scroll with snap points
- 🌙 Dark mode first design with gradient backgrounds
- 🎨 Glassmorphic UI elements with backdrop blur
- ⚡ Optimized performance with lazy loading
- 📱 Responsive design for all devices
- 🎯 TikTok-inspired UI patterns
- 🔒 Built-in security features

## Tech Stack

- **Framework:** SvelteKit 5
- **Styling:** Tailwind CSS
- **Performance:** Intersection Observer API
- **Build Tool:** Vite
- **Testing:** Vitest (coming soon)

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or pnpm

### Installation

1. Clone the repository:
bash
git clone [repository-url]

2. Install dependencies:

bash
pnpm install

3. Start the development server:

bash
pnpm dev

4. The project structure is as follows:
```
├── src/
│ ├── routes/ # SvelteKit routes
│ ├── lib/ # Shared components and utilities
│ ├── styles/ # Global styles
│ └── app.html # App template
├── static/ # Static assets
├── tests/ # Test files
└── vite.config.ts # Vite configuration
```

## Deployment

The application can be deployed to any platform that supports Node.js. Detailed deployment instructions coming soon.

## Support

For support, please open an issue in the repository.

## Authors

- Blackshore Technology Limited

## Acknowledgments

- SvelteKit team for the amazing framework
- TikTok for UI/UX inspiration

### Styling Guidelines

- Dark mode first design
- Tailwind CSS for styling
- Consistent padding and spacing
- Responsive typography
- Glassmorphic UI elements

### Contributing

This project is proprietary, but open for non-commercial use. Please read the [LICENSE](LICENSE) file before contributing.

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Open a pull request

### Commit Convention

Follow these commit message guidelines:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes
- refactor: Code refactoring
- test: Test changes
- chore: Build process or auxiliary tool changes

## Performance Considerations

- Implement lazy loading for images and content
- Use IntersectionObserver for viewport-based loading
- Optimize assets before deployment
- Maintain smooth scrolling and transitions

## Security

- All external inputs are validated and sanitized
- Markdown and HTML content is sanitized before rendering
- Following web security best practices

## Testing

Run tests with:
```bash
pnpm test
```
