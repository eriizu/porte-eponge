import bent from "bent";

import { notify } from "react-notify-toast";
import { IClock } from "../resources/Clocks";
import { isStatusError } from "./isStatusError";
import * as ResponseType from "./ResponseType";

import config from "../config";

export type DentifriceErrorType =
  | "E_STATUS_FORBIDDEN"
  | "E_STATUS_UNAUTHORIZED"
  | "E_CRED_EXCHANGE"
  | "E_UKN";

export class DentifriceError extends Error {
  type: DentifriceErrorType;
  constructor(type: DentifriceErrorType) {
    super(type);
    this.type = type;
  }
}

export default class Dentifrice {
  baseUrl: string;
  token: { access?: string | null; refresh?: string | null };
  // get: bent.RequestFunction<bent.Json>;
  // post: bent.RequestFunction<bent.Json>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // this.get = bent("json", "GET", 200, baseUrl);
    // this.post = bent("json", "POST", 201, baseUrl);
    // this.get = bent("json", "GET", 200, baseUrl);

    this.token = {
      access: localStorage.getItem("access_token"),
      refresh: localStorage.getItem("refresh_token"),
    };
  }

  get authHeader() {
    if (this.token.access) {
      return { Authorization: `bearer ${this.token.access}` };
    } else {
      return {};
    }
  }

  get post() {
    return bent("json", "POST", 201, this.baseUrl, { ...this.authHeader });
  }

  get get() {
    return bent("json", "GET", 200, this.baseUrl, { ...this.authHeader });
  }

  async exchangeDiscordCode(code: string, type: "CODE" | "REFRESH") {
    try {
      let query = type === "CODE" ? `?code=${code}` : `?refresh_token=${code}`;
      let response = await this.get(`/discord/access_token${query}`);
      if (ResponseType.isAccessAndRefreshTokens(response)) {
        localStorage.setItem("access_token", response.access_token);
        localStorage.setItem("refresh_token", response.refresh_token);
        return;
      }
    } catch (err) {
      console.log(err);
      notify.show(
        "Failed to exchange credentials. You may try to login again.",
        "error",
        5000
      );
      throw new DentifriceError("E_CRED_EXCHANGE");
    }
  }

  handlerError(err: any) {
    console.log("err", err);
    if (isStatusError(err)) {
      switch (err.statusCode) {
        case 401:
          this.token.access = null;
          notify.show(
            "Being logged in is required for this action.",
            "error",
            5000
          );
          throw new DentifriceError("E_STATUS_UNAUTHORIZED");
        // case 403:
        //   throw new DentifriceError("E_STATUS_FORBIDDEN");
        default:
          notify.show("A request failed in the background.", "warning", 5000);
      }
    }
  }

  async retryIfTokenExpired<T>(call: () => Promise<T>) {
    try {
      return await call();
    } catch (err) {
      if (isStatusError(err)) {
        if (err.statusCode === 401) {
          if (this.token.refresh) {
            this.token.access = "";
            await this.exchangeDiscordCode(this.token.refresh, "REFRESH");
            return await call();
          }
        }
      }
      throw err;
    }
  }

  async getAllClocks() {
    let res: bent.Json;
    try {
      res = await this.retryIfTokenExpired(
        async () => await this.get("/clocks")
      );
      // for (let entry of res) {
      //   assert(isClock(entry));
      // }
      return res as IClock[];
    } catch (err) {
      this.handlerError(err);
    }
  }

  async createClock(clock: IClock) {
    await this.post("/clocks", clock);
  }
}

export let dentifrice = new Dentifrice(config.DENTIFRICE_BASE_URL);
