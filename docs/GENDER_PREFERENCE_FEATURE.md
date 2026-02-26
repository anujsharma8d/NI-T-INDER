# Gender Preference Feature

## Overview

Users can now set their gender preference and will only see profiles matching their preference in the swipe feed and explore page.

## How It Works

### User Profile Setup
1. User sets their own gender (Male/Female)
2. User sets their preference for "Interested In":
   - **Male** - Only see male profiles
   - **Female** - Only see female profiles
   - **Everyone** - See all profiles regardless of gender

### Filtering Logic
- Backend filters profiles based on the user's `looking_for` preference
- Only profiles matching the preference are shown in:
  - Swipe feed (Home page)
  - Explore page
  - Profile recommendations

## Database Schema

```sql
profiles table:
  gender        CHAR(1)  -- 'M' (Male) or 'F' (Female)
  looking_for   CHAR(1)  -- 'M' (Men), 'F' (Women), or 'A' (Any/Everyone)
```

## Implementation Details

### Frontend Changes

**ProfileOptions.jsx**
- Updated gender field to dropdown with M/F options
- Changed "Looking For" to "Interested In" with proper options
- Added display mappings for gender and preference
- Made both fields required for better matching

**Field Configuration:**
```javascript
{
  key: "gender",
  label: "Gender",
  type: "select",
  required: true,
  options: [
    { value: "M", label: "Male" },
    { value: "F", label: "Female" },
  ],
},
{
  key: "looking_for",
  label: "Interested In",
  type: "select",
  required: true,
  options: [
    { value: "M", label: "Male" },
    { value: "F", label: "Female" },
    { value: "A", label: "Everyone" },
  ],
}
```

### Backend Changes

**profile.js Controller**

**Feed Endpoint (GET /profiles/feed):**
```javascript
// Get user's preference
const currentUserProfile = db
  .prepare(`SELECT looking_for FROM profiles WHERE user_id = @user_id`)
  .get({ user_id: userId });

// Filter by gender based on preference
if (preference === 'M') {
  query += ` AND p.gender = 'M'`;
} else if (preference === 'F') {
  query += ` AND p.gender = 'F'`;
}
// If 'A', show all genders
```

**All Profiles Endpoint (GET /profiles):**
- Same filtering logic applied
- Respects user's gender preference
- Used by Explore page

## User Experience

### Profile Setup Flow
1. User creates/edits profile
2. Selects their gender from dropdown
3. Selects who they're interested in
4. Saves profile

### Swipe Feed
- Only shows profiles matching preference
- If preference is "Everyone", shows all genders
- Updates immediately when preference changes

### Explore Page
- Same filtering as swipe feed
- Consistent experience across app
- No profiles outside preference shown

## Display Mappings

### Gender Display
```javascript
M → "Male"
F → "Female"
```

### Preference Display
```javascript
M → "Male"
F → "Female"
A → "Everyone"
```

## Examples

### Example 1: User Interested in Female
```
User Profile:
  gender: "M" (Male)
  looking_for: "F" (Female)

Result: Only sees female profiles
```

### Example 2: User Interested in Everyone
```
User Profile:
  gender: "F" (Female)
  looking_for: "A" (Everyone)

Result: Sees both male and female profiles
```

### Example 3: User Interested in Male
```
User Profile:
  gender: "F" (Female)
  looking_for: "M" (Male)

Result: Only sees male profiles
```

## Benefits

1. **Better Matches**: Users only see relevant profiles
2. **Time Saving**: No need to skip incompatible profiles
3. **User Control**: Clear preference selection
4. **Privacy**: Respects user preferences
5. **Inclusive**: "Everyone" option for open preferences

## Edge Cases Handled

1. **No Preference Set**: If user hasn't set preference, shows all profiles
2. **Invalid Values**: Backend handles case-insensitive values
3. **Missing Gender**: Profiles without gender still appear if preference is "Everyone"
4. **Profile Updates**: Preference changes take effect immediately

## Testing Checklist

- [ ] User can select gender (M/F)
- [ ] User can select preference (Male/Female/Everyone)
- [ ] Swipe feed respects preference
- [ ] Explore page respects preference
- [ ] "Everyone" shows all genders
- [ ] "Male" shows only male profiles
- [ ] "Female" shows only female profiles
- [ ] Preference saves correctly
- [ ] Display labels are correct
- [ ] Works after profile update

## Future Enhancements

Potential improvements:
- More gender options (Non-binary, etc.)
- Multiple preference selections
- Age range preferences
- Distance preferences
- Interest-based filtering
- Advanced filters page

## Migration Notes

**Existing Users:**
- Existing profiles may have old text values in `looking_for`
- Backend handles both old and new formats
- Users should update their profile to use new options

**Data Cleanup:**
If needed, run this SQL to standardize existing data:
```sql
-- Standardize gender values
UPDATE profiles SET gender = 'M' WHERE gender IN ('male', 'Male', 'm');
UPDATE profiles SET gender = 'F' WHERE gender IN ('female', 'Female', 'f');

-- Standardize looking_for values
UPDATE profiles SET looking_for = 'M' WHERE looking_for IN ('male', 'Male', 'm', 'men', 'Men');
UPDATE profiles SET looking_for = 'F' WHERE looking_for IN ('female', 'Female', 'f', 'women', 'Women');
UPDATE profiles SET looking_for = 'A' WHERE looking_for IN ('any', 'Any', 'everyone', 'Everyone', 'both', 'Both');
```

## API Documentation

### GET /profiles/feed
Returns profiles for swiping, filtered by user's gender preference.

**Response:**
```json
{
  "profiles": [
    {
      "id": "...",
      "name": "...",
      "gender": "F",
      "looking_for": "M",
      ...
    }
  ]
}
```

### GET /profiles
Returns all profiles, filtered by user's gender preference.

**Response:** Same as /profiles/feed

### PUT /profiles/:id
Update profile including gender and preference.

**Request Body:**
```json
{
  "gender": "M",
  "looking_for": "F"
}
```

## Conclusion

The gender preference feature provides users with control over who they see, improving match quality and user satisfaction. The implementation is simple, efficient, and respects user preferences throughout the app.
