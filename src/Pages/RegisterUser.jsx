import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TbFidgetSpinner } from "react-icons/tb";
const { VITE_REACT_APP_SERVER } = import.meta.env;

const RegisterUser = () => {
  const userData = sessionStorage.getItem("email");
  const [user, setUser] = useState({
    userName: "",
    emailId: "",
    otp: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const navigate = useNavigate();
  const handleChange = (e) => {
    const { value, name } = e.target;
    setUser({ ...user, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(user, "user");
    setIsLoading(true);
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
          setIsLoading(false);
        })
        .catch((err) => {
          console.log(err);
          setIsLoading(false);
        });
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
            setIsRegistered(true);
          }
          setShowOtp(true);
          setIsLoading(false);
        })
        .catch((err) => {
          console.log(err);
          setIsLoading(false);
        });
    }
  };

  useEffect(() => {
    if (userData) {
      setIsRegistered(true);
    }
  }, []);

  return (
    <div className="flex flex-row w-[100vw] h-[100vh] items-center justify-center">
      <div className="border-e-[1px] text-white h-fit flex w-[50%] items-center justify-start flex-col">
        <h1 className="text-center text-2xl mb-8">
          {isRegistered
            ? "Successfully Registered For Match"
            : "Register For Match"}
        </h1>
        {isRegistered ? (
          <div className="flex flex-row justify-center items-center text-center px-40">
            Congratulations on successfully registering for the match! You will
            receive further information via email.
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col w-full items-center justify-center gap-4"
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
            <button
              disabled={isLoading}
              type="submit"
              className="hover:scale-[1.05] transition-all duration-500 cursor-pointer flex flex-row items-center justify-center border-2 px-4 py-2 rounded w-[20%]"
            >
              {isLoading ? (
                <TbFidgetSpinner className="animate-spin" />
              ) : (
                "Submit"
              )}
            </button>
          </form>
        )}
      </div>
      <div className="text-white h-fit flex w-[50%] items-center justify-start flex-col">
        <h1 className="text-center text-2xl mb-8">AI Chess Match</h1>
        <div className="flex flex-row justify-center items-center text-center px-40 mb-4">
        Watch an AI vs. AI Chess Match. Stay tuned for the thrilling gameplay!
        </div>
        <button
          onClick={() => navigate("/match")}
          className="hover:scale-[1.05] transition-all duration-500 cursor-pointer flex flex-row items-center justify-center border-2 px-4 py-2 rounded w-[20%]"
        >
          Spectate
        </button>
      </div>
    </div>
  );
};

export default RegisterUser;
