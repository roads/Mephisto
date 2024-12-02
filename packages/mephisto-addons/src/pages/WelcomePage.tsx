/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";
import { STORAGE_USERNAME_KEY } from "../constants/localStorage";
import { generateRandomString } from "../helpers";

export default function WelcomePage() {
  const storagedUsername: string = localStorage.getItem(STORAGE_USERNAME_KEY);

  const [username, setUsername] = React.useState<string>(
    storagedUsername || ""
  );

  function openTaskPage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (username === "") {
      alert("Username cannot be empty");
    } else {
      localStorage.setItem(STORAGE_USERNAME_KEY, username);
      window.location.replace(
        `/?worker_id=${username}&id=${generateRandomString(10)}`
      );
    }
  }

  return (
    <>
      <div className="card container mt-xl-5" style={{ width: "600px" }}>
        <div className="card-body">
          <h5 className="card-title text-center mb-xl-4">
            Welcome to Mephisto
          </h5>

          <form onSubmit={openTaskPage}>
            <p className="card-text mb-xl-3">
              Please provide your username to start your task
            </p>

            <div className="form-group">
              <input
                className="form-control"
                id="id_username"
                placeholder={"Username"}
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setUsername(e.target.value);
                }}
              />
            </div>

            <button className={"btn btn-primary"} type={"submit"}>
              Start task
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
