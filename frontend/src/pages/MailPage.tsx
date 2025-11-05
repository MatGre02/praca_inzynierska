import { Typography, Container } from '@mui/material';

const MailPage = () => {
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ mb: 2 }}>
        ✉️ Wysyłanie Maili
      </Typography>
      <Typography variant="body1">
        Tutaj będzie możliwość wysyłania maili do zawodników.
      </Typography>
    </Container>
  );
};

export default MailPage;
