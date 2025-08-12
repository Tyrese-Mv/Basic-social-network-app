# Social Network

A modern, full-stack social networking application built with Next.js, TypeScript, and AWS DynamoDB. This project provides a complete social media experience with user authentication, posts, profiles, and real-time interactions.

## 🚀 Features

- **User Authentication**: Secure signup and login system with JWT tokens
- **Social Feed**: Dynamic feed displaying posts from all users
- **Create Posts**: Rich text posting functionality
- **User Profiles**: Individual profile pages with user information
- **Follow System**: Follow/unfollow other users
- **Suggested Profiles**: AI-powered profile recommendations
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Updates**: Dynamic content updates
- **AWS Integration**: Scalable backend with DynamoDB

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first CSS framework
- **Material-UI (MUI)** - React component library
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icon library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **AWS DynamoDB** - NoSQL database
- **JWT Authentication** - Secure token-based auth
- **bcrypt** - Password hashing

### Development & Testing
- **Jest** - Testing framework
- **React Testing Library** - Component testing
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Turbopack** - Fast development builds

## 📁 Project Structure

```
social-network/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (cards, avatars, etc.)
│   │   ├── CreatePost.tsx  # Post creation component
│   │   └── SuggestedProfilesCarousel.tsx
│   ├── pages/              # Next.js pages and API routes
│   │   ├── api/            # Backend API endpoints
│   │   │   ├── login.ts    # Authentication endpoints
│   │   │   ├── signup.ts
│   │   │   ├── feed.ts     # Feed data endpoint
│   │   │   ├── post.ts     # Post management
│   │   │   ├── follow.ts   # Follow/unfollow functionality
│   │   │   └── suggested-profiles.ts
│   │   ├── profile/        # User profile pages
│   │   ├── index.tsx       # Landing page
│   │   ├── login.tsx       # Login page
│   │   ├── signup.tsx      # Signup page
│   │   └── feed.tsx        # Main social feed
│   ├── lib/                # Utility functions and configurations
│   │   ├── auth.ts         # Authentication utilities
│   │   ├── aws-config.ts   # AWS configuration
│   │   └── utils.ts        # Helper functions
│   ├── services/           # Business logic services
│   │   ├── follow-services.ts
│   │   └── post-services.ts
│   ├── styles/             # Global styles
│   └── test/               # Test configuration
├── public/                 # Static assets
├── .next/                  # Next.js build output
└── node_modules/           # Dependencies
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **AWS Account** with DynamoDB access
- **TypeScript** knowledge

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd social-network
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   # AWS Configuration
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=your_aws_region
   
   # DynamoDB Tables
   USERS_TABLE=your_users_table_name
   
   # JWT Secret
   JWT_SECRET=your_jwt_secret_key
   ```

4. **AWS DynamoDB Setup**
   - Create a DynamoDB table for users
   - Configure table with appropriate partition and sort keys
   - Set up proper IAM permissions

### Development

1. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   The app will be available at `http://localhost:3000`

2. **Build for production**
   ```bash
   npm run build
   npm start
   ```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

## 🔧 Configuration

### TypeScript
The project uses strict TypeScript configuration with path aliases:
- `@/*` maps to `./src/*`
- ES2017 target with modern module resolution

### Next.js
- React Strict Mode enabled
- Turbopack for faster development builds
- Custom document and app configurations

### Tailwind CSS
- Version 4 with PostCSS
- Custom color schemes and animations
- Responsive design utilities

## 📱 Usage

### Authentication
1. Navigate to `/signup` to create a new account
2. Use `/login` to access existing accounts
3. JWT tokens are automatically managed

### Social Features
1. **Feed**: View all posts at `/feed`
2. **Create Posts**: Use the create post component
3. **Profiles**: Visit `/profile/[username]` for user profiles
4. **Follow Users**: Follow/unfollow from profile pages

### API Endpoints
- `POST /api/signup` - User registration
- `POST /api/login` - User authentication
- `GET /api/feed` - Retrieve social feed
- `POST /api/post` - Create new posts
- `POST /api/follow` - Follow/unfollow users
- `GET /api/suggested-profiles` - Get profile recommendations

## 🧪 Testing Strategy

- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: User workflow testing
- **Coverage**: Jest coverage reporting
- **Mocking**: Next.js router and AWS services mocking

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### AWS
1. Build the application: `npm run build`
2. Deploy to AWS Lambda or EC2
3. Configure environment variables
4. Set up custom domain if needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

### Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Write tests for new features
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Report bugs via GitHub Issues
- **Documentation**: Check the code comments and types
- **Community**: Join our development discussions

## 🔮 Roadmap

- [ ] Real-time notifications
- [ ] Direct messaging
- [ ] Media uploads
- [ ] Advanced search
- [ ] Mobile app
- [ ] Analytics dashboard
- [ ] Content moderation
- [ ] API rate limiting

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting and deployment
- AWS for scalable infrastructure
- Open source community for libraries and tools

---

**Built with ❤️ using Next.js, TypeScript, and AWS** 