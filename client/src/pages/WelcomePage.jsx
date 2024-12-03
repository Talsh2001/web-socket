import { Box, Typography } from "@mui/material";
import { WhatsApp } from "@mui/icons-material";

const WelcomePage = () => {
  return (
    <>
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        mr={{
          xs: "189.200px",
          sm: "239.200px",
          md: "299.200px",
        }}
        ml={2}
      >
        <WhatsApp sx={{ fill: "#1C3691", mb: 4, fontSize: { xs: 200, sm: 300 } }} />
        <Box maxWidth={380} textAlign="center">
          <Typography variant="h5">“If we fail, we fall.</Typography>
          <Typography variant="h5" mt={1}>
            If we succeed – then we will face the next task.”
          </Typography>
        </Box>
      </Box>
    </>
  );
};

export default WelcomePage;
