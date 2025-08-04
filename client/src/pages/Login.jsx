/* eslint-disable react/prop-types */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { socket } from "../socket";

const url = `${import.meta.env.VITE_API}/users`;

import { Box, TextField, Button, InputAdornment, IconButton } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const Login = ({ setJToken }) => {
  const [userLogin, setUserLogin] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const login = async () => {
    const { data } = await axios.post(`${url}/login`, userLogin);
    sessionStorage.setItem("accessToken", data.accessToken);
    setJToken(data.accessToken);
    socket.emit("new_user_connected", {
      username: data.username,
      id: data._id || data.id,
    });
    navigate("/main");
    sessionStorage.setItem("username", data.username);
  };

  const sign_up = async () => {
    const { data } = await axios.post(url, userLogin);
    console.log(data);
  };

  return (
    <>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        mx={1}
      >
        <Button sx={{ whiteSpace: "nowrap" }} onClick={sign_up} variant="contained">
          Sign up
        </Button>
        <Box mx={2}>
          <TextField
            sx={{ mb: 1 }}
            placeholder="username"
            onChange={(e) => setUserLogin({ ...userLogin, username: e.target.value })}
          />
          <br />
          <TextField
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 225 }}
            type={showPassword ? "text" : "password"}
            placeholder="password"
            onChange={(e) => setUserLogin({ ...userLogin, password: e.target.value })}
          />
        </Box>
        <Button onClick={login} variant="contained">
          Login
        </Button>
      </Box>
    </>
  );
};

export default Login;
