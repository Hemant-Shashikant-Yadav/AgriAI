import "../App.css";
import "../css/backgroundImage.css";
import NoteContext from "../context/notes/NoteContext";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
const Home = () => {
    const noteContext = useContext(NoteContext);

    // From AntDesign
    const [messageApi, contextHolder] = message.useMessage();

    const url = "http://localhost:5000/api/";

    // Destructuring
    const { notes, setNotes } = noteContext;
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageString, setImageString] = useState(null);
    const [uploadingStatus, setUploadingStatus] = useState(false);

    /**
     * Handles image input change to convert image to base64 string
     * Gets image file from input event
     * Sets state with new image file
     * Uses FileReader to read image as data URL
     * Draws image to canvas to get base64 string
     * Sets state with base64 string representation of image
     */
    const handleInputImageChange = (e) => {
        let newImage = e.target.files[0];
        setSelectedImage(newImage);

        const reader = new FileReader();
        try {
            // Set up the onload event handler for the FileReader
            reader.onload = function (event) {
                // Create a new Image object
                const image = new Image();

                // Set up the onload event handler for the Image
                image.onload = function () {
                    // Now that the image has loaded, you can access its dimensions

                    // Create a canvas element
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");

                    // Set the canvas dimensions to match the image
                    canvas.width = image.width;
                    canvas.height = image.height;

                    // Draw the image onto the canvas
                    ctx.drawImage(image, 0, 0);

                    // Get the base64-encoded data URL
                    const base64String = canvas.toDataURL("image/png");

                    setImageString(base64String);
                };

                // Set the source of the Image to the data URL obtained from FileReader
                image.src = event.target.result;
            };
            // Read the selected image as a data URL using FileReader
            reader.readAsDataURL(newImage);
        } catch (error) {}
    };

    // if not logged in then navigate to the login page
    const navigate = useNavigate();
    useEffect(() => {
        if (!localStorage.getItem("token")) {
            navigate("/login");
            return;
        }

        getNotes();
    }, []);

    let getNotes = async () => {
        try {
            const response = await fetch(`${url}notes/getallnotes`, {
                method: "GET",
                headers: {
                    "auth-token": localStorage.getItem("token"),
                },
            });

            // Check if the response is ok
            if (!response.ok) {
                return;
            }

            // Parse the JSON data from the response
            const data = await response.json();

            setNotes(data);
        } catch (error) {
            console.error("Error fetching notes:", error);
        }
    };

    /**
     * Uploads the base64-encoded image string to the server.
     * Shows loading indicator, handles errors, updates notes state on success.
     */
    const uploadImage = async () => {
        setUploadingStatus(true);
        try {
            messageApi.open({
                type: "loading",
                content: "Uploading Image...",
                duration: 0,
            });
            const response = await fetch(`${url}notes/addnote`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "auth-token": localStorage.getItem("token"),
                },
                body: JSON.stringify({
                    baseImage: imageString,
                }),
            });

            // Check if the response is ok
            if (!response.ok) {
                messageApi.destroy();
                messageApi.error("Error Uploading Image");
                setUploadingStatus(false);
                return;
            }
            // Updating notes
            const data = await response.json();
            const currentNotes = notes;
            currentNotes.push(data);
            setNotes(currentNotes);
            setSelectedImage(null);
            getNotes();
            messageApi.destroy();
            messageApi.success("Successfully uploaded image");
            setUploadingStatus(false);
        } catch (error) {
            messageApi.destroy();
            messageApi.error("Error Uploading Image");
            setUploadingStatus(false);
            console.error("Error Uploading notes:", error);
        }
    };
   
    return (
        <div className=" pt-3 pb-3 ">
            {contextHolder}
            <div className="container d-flex flex-column align-items-center justify-content-center text-xxl-center backgroundImage w-75">
                <h2
                    className="text-center fs-1 font-monospace pt-3 "
                    style={{ color: "red" }}
                >
                    {" "}
                    Welcome back,{" "}
                    {localStorage.getItem("username")
                        ? localStorage.getItem("username")
                        : "username"}{" "}
                    !!!
                </h2>
                <div className="image-upload-container  ">
                    <div className="img ">
                        <input
                            type="file"
                            accept="image/*"
                            name=""
                            id="image_upload"
                            hidden
                            onChange={handleInputImageChange}
                        />

                        <label
                            htmlFor="image_upload"
                            className="w-100 h-100 d-flex align-items-center justify-content-center"
                        >
                            {selectedImage ? (
                                <img
                                    src={URL.createObjectURL(selectedImage)}
                                    alt="selectedImage"
                                    className="w-100 h-100"
                                />
                            ) : (
                                <img
                                    src="upload.png"
                                    alt="Browse Images"
                                    className="w-50 h-100"
                                />
                            )}
                        </label>
                    </div>
                    <button
                        className="btn btn-outline-dark border-2 w-100 my-3 text-dark-emphasis fs-4"
                        onClick={uploadImage}
                        disabled={!selectedImage || uploadingStatus}
                    >
                        Upload Image
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Home;
