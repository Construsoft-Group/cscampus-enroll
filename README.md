# Moodle Enrollment Management System

Automated system for managing Moodle enrollments through web forms. Enables customized flows for user creation and enrollment across different courses on the educational platform.

## Description

This Node.js application automates the Moodle enrollment process through specialized web forms. The system handles different types of educational programs (scholarships, technical programs, university partnerships) and integrates external services such as SharePoint for document storage and email notifications.

## Features

- **Customized web forms** for different educational programs
- **Moodle API integration** for automatic user creation and enrollment
- **Group management** and automatic assignment based on program
- **SharePoint integration** for document storage
- **Email notification system** with custom templates
- **Duplicate request validation** to prevent repeated submissions
- **Automatic processing** via scheduled cron jobs
- **MySQL database** for request storage and tracking

## Project Architecture

```
enrol_management/
├── src/
│   ├── app.js                # Main Express configuration
│   ├── index.js              # Application entry point
│   ├── config.js             # Database and port configuration
│   ├── database.js           # MySQL connection pool
│   ├── job.js                # Scheduled tasks
│   ├── config/
│   │   ├── courses.js        # Course and group configuration
│   │   ├── moodle.js         # Moodle API integration
│   │   ├── sendMail.js       # Email service
│   │   ├── sharepoint.js     # SharePoint integration
│   │   └── email_templates/  # Email templates
│   ├── routes/
│   │   ├── index.js          # Main router
│   │   ├── beca.router.js    # Scholarship program routes
│   │   ├── cs.router.js      # CS program routes
│   │   ├── tc.router.js      # Trimble Connect routes
│   │   ├── eude.router.js    # EUDE program routes
│   │   └── db.router.js      # Database management routes
│   ├── services/
│   │   ├── beca.service.js   # Scholarship business logic
│   │   ├── cs.service.js     # CS business logic
│   │   ├── tc.service.js     # TC business logic
│   │   ├── eude.service.js   # EUDE business logic
│   │   └── db.service.js     # Database services
│   ├── views/               # EJS templates
│   └── public/             # Static files (CSS, JS)
├── docs/
│   ├── enrollment-flows.md  # Detailed enrollment flow documentation
│   ├── beca-flow.md         # Scholarship program flow
│   ├── cs-flow.md           # CS program flow (Customer + Hotmart)
│   ├── tc-flow.md           # Trimble Connect program flow
│   └── eude-flow.md         # EUDE program flow
├── package.json
└── README.md
```

## Installation

### Prerequisites
- Node.js 18.x or higher
- MySQL
- Moodle API access
- SharePoint configuration (optional)
- SMTP server for email delivery

### Setup Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd enrol_management
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the project root:
```env
# Database
DB_HOST=db_server
DB_NAME=db_name
DB_USER=db_user
DB_PASS=db_password

# Email (SMTP)
MAIL_ACCOUNT=email_address
MAIL_PASS=email_password

# Moodle
MDL_DOMAIN=moodle_domain
MDL_TOKEN=moodle_token

# SharePoint
SP_CLIENT_ID=sharepoint_client_id
SP_CLIENT_SECRET=client_secret
SP_TENANT_ID=tenant_id
SP_TENANT_NAME=tenant_name
SP_REFRESHTOKEN=refresh_token

# Application port
PORT=4000
```

4. **Configure the database**
- Create the MySQL database
- Run the required table creation scripts

5. **Start the application**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Configuration

### Courses and Groups
The file `src/config/courses.js` contains the configuration for all available courses and their groups. Each course includes:
- Moodle course ID
- Course name
- Course URL
- Available groups with their IDs and names

### Email Templates
Email templates are located in `src/config/email_templates/` and are organized by program type. They use the EJS template engine.

## Main Endpoints

### Scholarship Program (Beca)
- `GET /beca/form` — Scholarship request form
- `POST /beca` — Process scholarship request

### CS Program (Customer Success)
- `GET /cs/form` — Customer enrollment form
- `POST /cs` — Process customer request
- `POST /cs/hotmart` — Hotmart webhook for automatic enrollment

### Trimble Connect Program
- `GET /tc/form` — Trimble Connect form
- `POST /tc` — Process TC request

### EUDE Program
- `GET /eude/form` — EUDE program form
- `POST /eude` — Process EUDE request

### Database Management
- `GET /db/courses` — View available courses
- Other administration endpoints

## Enrollment Process (Overview)

1. **User completes** the program-specific web form
2. **Data validation** and duplicate check
3. **Document upload** to SharePoint (if applicable)
4. **User creation** in Moodle (if not already registered)
5. **Course enrollment** and assignment to the corresponding group
6. **Email notifications** sent to user and administrators
7. **Database record** stored for tracking

For detailed flow documentation per program, see the [docs/](docs/) folder.

## Scheduled Tasks

The system runs automatic tasks via cron jobs:
- Processing pending scholarship (Beca) requests
- Automatic enrollments
- Temporary record cleanup

> **Note:** CS, TC, and EUDE programs process enrollments immediately on form submission. Only the Beca program uses an asynchronous cron-based flow.

## Technologies Used

- **Backend**: Node.js with Express.js
- **Database**: MySQL
- **Template engine**: EJS
- **API integration**: Axios
- **File uploads**: Formidable
- **Scheduled tasks**: node-cron
- **Email delivery**: Nodemailer
- **Form data**: Form-data

## Notification System

The system sends different types of email notifications:
- Request reception confirmation
- Successful enrollment notification
- Rejection notification (for scholarships)
- Internal admin notifications

## Security

- Input data validation
- Duplicate request prevention
- Secure file upload handling
- Environment variables for credentials

## Deployment

For production deployment:
1. Configure appropriate environment variables
2. Ensure connectivity with Moodle and SharePoint
3. Configure a web server (nginx/Apache) as a reverse proxy
4. Set up SSL/TLS
5. Implement monitoring and logging

## Contributing

1. Fork the project
2. Create a branch for the new feature (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is licensed under the ISC License.

## Support

For technical support or inquiries, contact the development team.

---

**Version**: 1.0.0  
**Node.js**: 18.x  
**Author**: Development Team
