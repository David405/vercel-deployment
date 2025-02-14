# Bloom Web Server - README

## Getting Started

Follow these steps to set up and run Bloom Web Server locally.

### 1. Clone the Repository

```sh
git clone https://github.com/bloomwalletio/bloom-web-server.git
cd bloom-web-server
```

### 2. Install Yarn (if not already installed)

If you do not have Yarn installed, install it globally:

```sh
npm install -g yarn
```

You can verify the installation with:

```sh
yarn --version
```

### 4. Configure Environment Variables

Copy the `.env.example` file and add the development API keys.

```sh
cp .env.example .env
```

Open `.env` and add the necessary API keys:

```sh
NODE_ENV=''
DATABASE_URL=''
PORT=''
```

Sample 
```
NODE_ENV='dev'
DATABASE_URL="postgresql://username:password@localhost:5432/bloom_server_db?schema=public"
PORT='3004'
 ```

## Setting Up PostgreSQL Database and Running Prisma

### 1. Install PostgreSQL

If you haven't already installed PostgreSQL, you can download it from the [official PostgreSQL website](https://www.postgresql.org/download/) and follow the installation instructions for your operating system.

### 2. Create a PostgreSQL Database

After installing PostgreSQL, you can create a new database. You can do this using the command line or a GUI tool like pgAdmin.

**Using Command Line:**

1. Open your terminal.
2. Access the PostgreSQL command line interface:
   ```bash
   psql -U postgres
   ```
   (You may need to enter your PostgreSQL password.)

3. Create a new database:
   ```sql
   CREATE DATABASE your_database_name;
   ```

4. Exit the PostgreSQL prompt:
   ```sql
   \q
   ```

### 3. Install Prisma CLI

If you haven't installed Prisma CLI yet, you can do so by running the following command in your project directory:

```sh
yarn install --save-dev prisma
```

### 4. Migrate Prisma

```sh
npx prisma migrate dev --name <migration_name>
```

### 5. Install Dependencies

```sh
yarn install
```

### 6. Run the Development Server

```sh
yarn dev
```

### 7. Build for Production

```sh
yarn build
```

### 8. Additional Scripts

Run various scripts using:

```sh
yarn <script-name>
```

Available scripts:

- `dev` - Start the development server.
- `build` - Build the project for production.
- `preview` - Preview the production build.
- `check` - Run Svelte and TypeScript checks.
- `lint` - Run Prettier and ESLint.
- `format` - Format code using Prettier.
- `docker:build` - Build a Docker image.
- `docker:run` - Run the Docker container.
- `docker:stop` - Stop the running Docker container.
- `docker:remove` - Remove the Docker container.
- `docker:clean` - Remove the Docker image.

## Additional Notes

- Ensure your GitHub token has the necessary permissions to access private repositories if applicable.
- If encountering authentication issues, double-check your `.npmrc` configuration and token validity.
- Ensure that all required API keys are correctly added to the `.env` file.
- Yarn is used as the package manager instead of npm.

---

For more details, refer to the project documentation or contact the development team.
