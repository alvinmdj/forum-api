# Forum API

Dicoding - BE Expert Submission

## Setup

### Setup postgresql db

- Login as root user: ```psql --username postgres```

- Create db: ```CREATE DATABASE forumapi; CREATE DATABASE forumapi_test;```

- Grant access to user 'alvin': ```GRANT ALL PRIVILEGES ON DATABASE forumapi, forumapi_test TO alvin;```

### Run migration

- App db: ```npm run migrate up```

- Test db: ```npm run migrate:test up```

### Run test (watch mode)

- ```npm run test:watch```

### Run server

- Prod: ```npm run start```

- Dev: ```npm run start:dev```
