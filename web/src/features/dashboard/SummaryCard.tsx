/**
 * One MUI card showing a single dashboard metric (Total Products, Total Stock Units, Low Stock,
 * Out of Stock). When `to` is provided the whole card becomes a keyboard-accessible link that
 * navigates to the (optionally pre-filtered) inventory list.
 */
import { Card, CardActionArea, CardContent, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export function SummaryCard({
  label,
  value,
  emphasis = 'default',
  to,
}: {
  label: string;
  value: number;
  emphasis?: 'default' | 'warning' | 'error';
  to?: string;
}) {
  const color = emphasis === 'warning' ? 'warning.main' : emphasis === 'error' ? 'error.main' : 'text.primary';

  const body = (
    <CardContent>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      <Typography variant="h4" component="div" sx={{ color }}>
        {value.toLocaleString()}
      </Typography>
    </CardContent>
  );

  return (
    <Card sx={{ height: '100%' }}>
      {to ? (
        <CardActionArea
          component={RouterLink}
          to={to}
          sx={{ height: '100%' }}
          aria-label={`${label}: ${value.toLocaleString()}. View in inventory.`}
        >
          {body}
        </CardActionArea>
      ) : (
        body
      )}
    </Card>
  );
}
