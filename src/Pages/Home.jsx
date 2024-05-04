import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [tourList, setTourList] = useState([]);
  const [TName, setTName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getAllTour = () => {
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: "http://localhost:5000/api/brackets/getAllTours",
    };

    axios
      .request(config)
      .then((response) => {
        console.log(response.data);
        setTourList(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const createTour = (e) => {
    e.preventDefault();
    if (!TName) {
      alert("Enter Tournament Name");
      return;
    }
    setIsLoading(true);
    let data = JSON.stringify({
      TName: TName,
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "http://localhost:5000/api/brackets/create",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    axios
      .request(config)
      .then((response) => {
        alert("Tournament Created Successfully");
        getAllTour();
        setIsLoading(false);
      })
      .catch((error) => {
        console.log(error);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    getAllTour();
  }, []);

  return (
    <div className="min-w-[100%] min-h-[90vh] py-4 px-10 flex flex-col gap-2 ">
      <h1 className="text-4xl font-bold text-white">Tournaments</h1>
      <div className="text-white flex flex-col gap-2 ">
        {tourList?.length &&
          tourList.map((item) => (
            <div
              className="transition duration-300 ease border-white border-[1px] px-3 py-2 cursor-pointer hover:scale-[1.01]"
              key={item.TID}
              onClick={() => {
                const dataString = JSON.stringify(item);
                sessionStorage.setItem('tourData', dataString);
                navigate(`/tournament/${item.TID}`);
              }}
            >
              Name: {item.tournamentName} || TID: {item.TID} || status:{" "}
              {item.state} || progress: {item.progress} % || type: {item.type}
            </div>
          ))}
      </div>
      <div>
        <form
          className="flex flex-row items-center"
          onSubmit={(e) => createTour(e)}
        >
          <div className="bg-black py-2 pl-4">
            <input
              className="text-white bg-transparent border-white border-r-[1px]"
              type="text"
              name="Tname"
              value={TName}
              minLength={3}
              required={true}
              onChange={(e) => {
                console.log(e.currentTarget.value);
                setTName(e.currentTarget.value);
              }}
            />
          </div>
          <button
            className="bg-black text-white py-2 px-6"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Loading" : "Create"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Home;
