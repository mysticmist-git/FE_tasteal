import { Box } from "@mui/material";
import React from "react";
import { Footer } from "../components/ui/layout/Footer";
import { Header } from "../components/ui/layout/Header";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Box
      component={"div"}
      sx={{
        backgroundColor: "#fffaf9",
        px: 0,
      }}
    >
      <Header />
      {children}
      <Footer />
    </Box>
  );
}

export default Layout;
