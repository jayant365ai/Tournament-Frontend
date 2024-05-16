import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const { VITE_REACT_APP_SERVER } = import.meta.env;

const RegisterUser = () => {
  const [user, setUser] = useState({
    userName: "",
    emailId: "",
    otp: "",
  });
  const [showOtp, setShowOtp] = useState(false);
  const navigate = useNavigate();
  const handleChange = (e) => {
    const { value, name } = e.target;
    setUser({ ...user, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(user, "user");
    if (!showOtp) {
      axios
        .post(
          `${VITE_REACT_APP_SERVER}api/user/send-otp`,
          {
            email: user.emailId,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
        .then((res) => {
          console.log(res);
          setShowOtp(true);
        })
        .catch((err) => console.log(err));
    } else {
      let data = {
        email: user.emailId,
        otp: user.otp,
        userName: user.userName,
      };
      axios
        .post(`${VITE_REACT_APP_SERVER}api/user/login`, data, {
          headers: {
            "Content-Type": "application/json",
          },
        })
        .then((res) => {
          if (res.data.success) {
            sessionStorage.setItem("email", user.emailId);
            navigate("/match");
          }
          setShowOtp(true);
        })
        .catch((err) => console.log(err));
    }
  };

  return (
    <div className="flex flex-row w-[100vw]">
      <div className="text-white h-[95vh] flex w-[50%]  justify-center flex-col">
        <h1 className="text-center text-[2rem] mb-8">Register For Matches</h1>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center justify-center gap-4"
        >
          <div className="text-black w-[80%] md:w-[50%]">
            <p className="text-white font-medium text-[1rem]">Name</p>
            <input
              type="text"
              name="userName"
              placeholder="Enter your name"
              value={user.userName}
              onChange={handleChange}
              className="w-full p-2"
            />
          </div>
          <div className="text-black w-[80%] md:w-[50%] ">
            <p className="text-white text-[1rem]">Email</p>
            <input
              type="email"
              name="emailId"
              required
              disabled={showOtp}
              placeholder="Enter your email"
              value={user.emailId}
              onChange={handleChange}
              className="w-full p-2"
            />
          </div>
          {showOtp && (
            <div className="text-black w-[80%] md:w-[50%] ">
              <p className="text-white text-[1rem]">OTP</p>
              <input
                type="text"
                name="otp"
                placeholder="Enter the OTP"
                value={user.otp}
                onChange={handleChange}
                className="w-full p-2"
              />
            </div>
          )}
          <button type="submit" className="border-2 px-4 py-2 rounded w-[20%]">
            Submit
          </button>
        </form>
      </div>
      <div className="text-white h-[95vh] flex w-[50%] items-center justify-center flex-col">
        <div className="text-[2rem] mb-10">Speactate Current Matches</div>
        <button onClick={() => navigate("/match")} className="border-2 px-4 py-2 rounded w-[20%]">
            Go To Match
          </button>
      </div>
    </div>
  );
};

export default RegisterUser;
