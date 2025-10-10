# Campus Connect - Deployment Guide

## 🚀 Complete Deployment Instructions

This guide covers deploying the Campus Connect platform to production.

## Prerequisites

- Node.js 18+ installed locally
- Supabase account
- Git repository
- Domain name (optional)

## 1. Database Setup (Supabase)

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details:
   - **Name**: campus-connect
   - **Database Password**: (generate a strong password)
   - **Region**: Choose closest to your users
4. Wait for project provisioning (~2 minutes)

### Step 2: Run Database Migration

1. Go to **SQL Editor** in Supabase dashboard
2. Click "New Query"
3. Copy entire contents of `supabase/migrations/001_complete_campus_platform.sql`
4. Paste and click "Run"
5. Verify all tables created successfully

### Step 3: Configure Authentication

1. Go to **Authentication > Providers**
2. Enable Email provider
3. **Settings**:
   - Disable "Confirm email" for testing
   - Enable "Enable email confirmations" for production
   - Set site URL to your production domain

### Step 4: Get API Credentials

1. Go to **Project Settings > API**
2. Copy these values:
   - **Project URL** (VITE_SUPABASE_URL)
   - **anon public** key (VITE_SUPABASE_ANON_KEY)

## 2. Frontend Deployment

### Option A: Vercel (Recommended)

1. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

2. **Configure Environment Variables**:
   Create `.env.production`:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Deploy via Vercel Dashboard**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository
   - Configure:
     - **Framework Preset**: Vite
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
   - Add environment variables
   - Click "Deploy"

4. **Or Deploy via CLI**:
   ```bash
   vercel
   # Follow prompts
   vercel --prod
   ```

### Option B: Netlify

1. **Install Netlify CLI** (optional):
   ```bash
   npm i -g netlify-cli
   ```

2. **Create `netlify.toml`**:
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

3. **Deploy via Netlify Dashboard**:
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site"
   - Import from Git
   - Configure:
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`
   - Add environment variables
   - Click "Deploy"

4. **Or Deploy via CLI**:
   ```bash
   netlify deploy --prod
   ```

### Option C: Manual Deployment

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Upload dist/ folder**:
   - Upload to any static hosting service
   - Ensure environment variables are set
   - Configure SPA routing (redirect all to index.html)

## 3. Environment Variables

### Required Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Setting Environment Variables

**Vercel**:
- Dashboard → Project → Settings → Environment Variables
- Or use CLI: `vercel env add`

**Netlify**:
- Dashboard → Site → Site settings → Environment variables
- Or use CLI: `netlify env:set`

**Local Development**:
- Create `.env` file in project root
- Add variables (never commit this file)

## 4. Post-Deployment Configuration

### Configure CORS

In Supabase Dashboard:
1. Go to **Settings > API**
2. Add your deployment URL to **Allowed Origins**

### Set Up Storage Buckets (for file uploads)

1. Go to **Storage** in Supabase
2. Create buckets:
   - `avatars` (public)
   - `banners` (public)
   - `resources` (public)
3. Set up policies for each bucket

### Enable Realtime

1. Go to **Database > Replication**
2. Enable replication for tables:
   - posts
   - comments
   - likes
   - connections
   - messages
   - notifications

## 5. Initial Data Setup

### Create Admin User

1. **Sign up through the app**
2. **Update role in Supabase**:
   ```sql
   UPDATE profiles
   SET role = 'admin'
   WHERE email = 'admin@example.com';
   ```

### Seed Sample Data (Optional)

Run these SQL queries in Supabase SQL Editor:

```sql
-- Create sample students
INSERT INTO profiles (id, email, first_name, last_name, role, department, graduation_year)
SELECT
  gen_random_uuid(),
  'student' || generate_series(1,10) || '@campus.edu',
  'Student',
  'User' || generate_series(1,10),
  'student',
  CASE (random() * 3)::int
    WHEN 0 THEN 'Computer Science'
    WHEN 1 THEN 'Business'
    WHEN 2 THEN 'Engineering'
    ELSE 'Liberal Arts'
  END,
  2024 + (random() * 4)::int
FROM generate_series(1,10);

-- Create sample alumni
INSERT INTO profiles (id, email, first_name, last_name, role, department, graduation_year, current_company, willing_to_mentor)
SELECT
  gen_random_uuid(),
  'alumni' || generate_series(1,5) || '@campus.edu',
  'Alumni',
  'User' || generate_series(1,5),
  'alumni',
  'Computer Science',
  2020 - (random() * 5)::int,
  CASE (random() * 4)::int
    WHEN 0 THEN 'Google'
    WHEN 1 THEN 'Microsoft'
    WHEN 2 THEN 'Amazon'
    WHEN 3 THEN 'Meta'
    ELSE 'Apple'
  END,
  true
FROM generate_series(1,5);

-- Create sample events
INSERT INTO events (created_by, title, description, event_type, start_date, location, tags)
SELECT
  (SELECT id FROM profiles WHERE role = 'faculty' LIMIT 1),
  'Campus Event ' || generate_series(1,5),
  'Join us for an exciting event on campus',
  CASE (random() * 4)::int
    WHEN 0 THEN 'career'
    WHEN 1 THEN 'workshop'
    WHEN 2 THEN 'cultural'
    WHEN 3 THEN 'sports'
    ELSE 'academic'
  END,
  now() + (generate_series(1,5) || ' days')::interval,
  'Main Campus',
  ARRAY['networking', 'career']
FROM generate_series(1,5);
```

## 6. Monitoring & Maintenance

### Set Up Monitoring

**Supabase Monitoring**:
- Go to **Reports** in Supabase dashboard
- Monitor:
  - API requests
  - Database performance
  - Error rates
  - Active connections

**Frontend Monitoring**:
- Use Vercel Analytics
- Or integrate Google Analytics
- Set up error tracking (Sentry)

### Backup Strategy

**Database Backups** (Automatic on Supabase):
- Daily automatic backups
- Point-in-time recovery available
- Manual backup export available

**Code Backups**:
- Use Git version control
- Tag releases
- Maintain changelog

### Security Checklist

- [ ] Environment variables secured
- [ ] CORS configured properly
- [ ] RLS policies tested
- [ ] Authentication flows verified
- [ ] File upload limits set
- [ ] Rate limiting configured
- [ ] Error messages sanitized
- [ ] HTTPS enabled
- [ ] Security headers configured

## 7. Performance Optimization

### Database Optimization

1. **Analyze Query Performance**:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM posts
   ORDER BY created_at DESC
   LIMIT 20;
   ```

2. **Add Missing Indexes**:
   - Check slow query logs
   - Add indexes on frequently queried columns

3. **Enable Connection Pooling**:
   - Already enabled in Supabase
   - Configure max connections if needed

### Frontend Optimization

1. **Code Splitting**:
   - Already implemented with Vite
   - Lazy load heavy components

2. **Image Optimization**:
   - Use Supabase image transformation
   - Implement lazy loading
   - Add WebP format support

3. **Caching Strategy**:
   - Set up CDN caching
   - Configure browser caching
   - Implement service workers

## 8. Troubleshooting

### Common Issues

**Build Fails**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Database Connection Issues**:
- Check Supabase project status
- Verify environment variables
- Check CORS settings
- Verify RLS policies

**Authentication Problems**:
- Check JWT token validity
- Verify Supabase auth settings
- Clear browser cache
- Check user session expiration

**Real-time Not Working**:
- Enable replication in Supabase
- Check WebSocket connections
- Verify subscription channels
- Check browser console for errors

### Debug Mode

Enable debug logs:
```javascript
// In supabase.ts
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      debug: true
    }
  }
);
```

## 9. Scaling Considerations

### Horizontal Scaling

**Supabase**:
- Automatically scales
- Upgrade plan for more resources
- Consider read replicas for high traffic

**Frontend**:
- CDN distribution (Vercel/Netlify)
- Global edge network
- Load balancing (automatic)

### Vertical Scaling

**Database**:
- Monitor resource usage
- Upgrade Supabase plan
- Optimize queries

**Storage**:
- Monitor storage usage
- Implement file size limits
- Add cleanup policies

## 10. Production Checklist

Before going live:

### Configuration
- [ ] Environment variables set
- [ ] Database migration run
- [ ] Authentication configured
- [ ] CORS configured
- [ ] Storage buckets created
- [ ] Realtime enabled

### Testing
- [ ] User registration works
- [ ] Login/logout works
- [ ] All pages accessible
- [ ] Real-time features work
- [ ] File uploads work
- [ ] Notifications work
- [ ] Mobile responsive

### Security
- [ ] RLS policies active
- [ ] SQL injection prevented
- [ ] XSS protection enabled
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] Input validation working

### Performance
- [ ] Page load < 3 seconds
- [ ] Images optimized
- [ ] Caching configured
- [ ] CDN enabled
- [ ] Database indexed

### Monitoring
- [ ] Error tracking set up
- [ ] Analytics configured
- [ ] Uptime monitoring
- [ ] Alert systems configured
- [ ] Backup verified

## 11. Maintenance Schedule

### Daily
- Monitor error logs
- Check system health
- Review user feedback

### Weekly
- Database performance review
- Security audit
- Backup verification
- Update dependencies

### Monthly
- Full system audit
- Performance optimization
- Feature updates
- User analytics review

## 12. Support & Documentation

### User Documentation
- Create user guides
- FAQ section
- Video tutorials
- Onboarding flow

### Developer Documentation
- API documentation
- Database schema docs
- Component library
- Contributing guide

## 13. Cost Estimation

### Supabase (Free Tier)
- 500MB database
- 1GB file storage
- 2GB bandwidth
- Good for small campuses

### Supabase (Pro - $25/month)
- 8GB database
- 100GB file storage
- 50GB bandwidth
- Better for larger campuses

### Vercel (Hobby - Free)
- Unlimited deployments
- 100GB bandwidth
- Automatic HTTPS
- Custom domain

### Total Estimated Cost
- **Small campus (<500 users)**: $0-25/month
- **Medium campus (500-2000 users)**: $25-99/month
- **Large campus (2000+ users)**: $99-299/month

## 14. Success Metrics

Track these KPIs:
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- User engagement rate
- Connection growth rate
- Event attendance rate
- Job application rate
- Mentorship success rate
- User retention rate

## 15. Launch Strategy

### Soft Launch (Week 1)
- Beta test with 50 users
- Collect feedback
- Fix critical bugs
- Monitor performance

### Phased Rollout (Week 2-4)
- Open to one department
- Expand to more departments
- Add features based on feedback
- Scale infrastructure

### Full Launch (Month 2)
- Campus-wide announcement
- Promotional campaign
- Training sessions
- Support team ready

---

**Need Help?**
- Check the [Platform Guide](./PLATFORM_GUIDE.md)
- Review [Supabase Documentation](https://supabase.com/docs)
- Contact the development team

**Status**: Ready for Deployment ✅
