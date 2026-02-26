# MongoDB Setup for NITinder

## Option 1: MongoDB Atlas (Recommended - Free)

1. **Go to MongoDB Atlas**: https://www.mongodb.com/atlas
2. **Sign up** for a free account
3. **Create a cluster**:
   - Click "Build a Database"
   - Choose "M0 Sandbox" (free)
   - Select a cloud provider and region (choose closest to you)
   - Leave cluster name as default or change to "nitinder"
4. **Create database user**:
   - Username: `nitinder`
   - Password: Generate a strong password
5. **Add IP address**:
   - Choose "Allow access from anywhere" (0.0.0.0/0)
   
   > **Tip:** Atlas restricts connections by IP. If you're deploying on a
   > platform like Render or Vercel, make sure to either whitelist the
   > provider's outbound IP range or temporarily allow `0.0.0.0/0` while you
   > test. A misconfigured network access list usually causes the TLS handshake
   > errors (`ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR`) seen in the logs.
6. **Get connection string**:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password

## Option 2: Local MongoDB

### Windows:
1. Download MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Install with default settings
3. Start MongoDB service:
   ```
   net start MongoDB
   ```

### Mac:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

## Environment Variables

Add to your `.env` file:

```env
# For MongoDB Atlas
# Use the connection string Atlas generates. It should look like:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/nitinder?retryWrites=true&w=majority
# TLS/SSL is enabled automatically by the driver when you use a +srv
# URI. You shouldn't need to add any extra flags to the client code.
# If you see TLS handshake errors (e.g. `ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR`),
# verify the URI is correct, the deployment platform has network access to
# Atlas, and that the Node runtime supports the required TLS version.
MONGODB_URI=mongodb+srv://nitinder:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/nitinder?retryWrites=true&w=majority
DATABASE_NAME=nitinder

# For Local MongoDB
# No TLS required for a local instance; use the standard URI.
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=nitinder

# Other required variables
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=https://ni-t-inder.vercel.app
BREVO_API_KEY=your-brevo-api-key
PORT=3000
ALGORITHM=HS256
```
