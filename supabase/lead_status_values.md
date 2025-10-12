# Lead Status Values

The leads table uses the following standard status values:

## Status Options

| Value | English | Hebrew | Description |
|-------|---------|--------|-------------|
| `new` | New | חדש | Newly created lead, not yet contacted |
| `contacted` | Contacted | נוצר קשר | Initial contact has been made |
| `in_progress` | In Progress | בטיפול | Lead is being actively worked on |
| `qualified` | Qualified | מוסמך | Lead has been qualified as a potential customer |
| `converted` | Converted | הומר | Lead has been converted to a customer |
| `closed` | Closed | סגור | Lead process is closed/completed |
| `irrelevant` | Irrelevant | לא רלוונטי | Lead is not relevant or doesn't meet criteria |

## Database Schema

The `status` column in the `leads` table is defined as `TEXT` with a default value of `'new'`. This allows for flexible status values without requiring database schema changes.

```sql
status TEXT DEFAULT 'new'
```

## Usage

Status can be updated through the leads management interface. Users can select any of the above status values from a dropdown menu. Status changes are automatically saved to the database and reflected in real-time in the UI.
