import React from "react";
// import moment from "moment";
import "./ClockEditor.css";
import { RouteComponentProps } from "react-router-dom";
import ClockCard from "../ClockCard";

import "moment/locale/fr";
import "moment/locale/en-gb";
import { IClock } from "../../resources/Clocks";

import { dentifrice } from "../../dataSources/Dentfrice";

interface IProps {
  clock?: IClock;
  setTitle: (title: string) => void;
}

interface IMissingFields {
  date?: boolean;
  name?: boolean;
  direction?: boolean;
}

interface IState {
  clock: IClock;
  form: IForm;
  error?: string;
}

interface IForm {
  name?: string;
  hasStart?: boolean;
  hasEnd?: boolean;
  startdate?: string;
  starttime?: string;
  enddate?: string;
  endtime?: string;
  count: "UP" | "DOWN";
}

class EditorError extends Error {
  // constructor(message: string) {
  //   super(message);
  // }
}

export default class ClockEditor extends React.Component<
  IProps & RouteComponentProps,
  IState
> {
  constructor(props: IProps & RouteComponentProps) {
    super(props);
    this.state = {
      clock: props.clock || {
        name: "New Clock",
        count: "UP",
        start: new Date(),
      },
      form: { count: "DOWN" },
    };
  }

  componentDidMount() {
    this.validate(this.state.form);
  }

  datetimeToDateAndTime(src: Date) {
    let date = `${src.getFullYear()}-${src.getMonth()}-${src.getDate()}`;
    let time = `${src.getHours()}:${src.getMinutes()}`;
    return { date, time };
  }

  clockToForm(clock: IClock): IForm {
    let start = { date: "", time: "" };
    if (clock.start) {
      start = { ...this.datetimeToDateAndTime(clock.start) };
    }

    let end = { date: "", time: "" };
    if (clock.end) {
      end = { ...this.datetimeToDateAndTime(clock.end) };
    }
    return {
      name: clock.name,
      count: clock.count || "DOWN",
      startdate: start.date,
      starttime: start.time,
      enddate: end.date,
      endtime: end.time,
    };
  }

  parseDateTime(date?: string, time?: string) {
    // TODO: if end date, setting time to midnight maybe isn't the right thing
    if (date && date !== "") {
      if (!time || time === "") {
        time = "00:00";
      }
      return new Date(`${date} ${time}`);
    } else {
      return undefined;
    }
  }

  formToClock(form: IForm): IClock {
    let start = this.parseDateTime(form.startdate, form.starttime);
    let end = this.parseDateTime(form.enddate, form.endtime);

    let count = form.count;

    if (count === "UP" && !start) {
      throw new EditorError("If clock counts up, a start date is needed.");
    } else if (count === "DOWN" && !end) {
      throw new EditorError("If clock counts down, an end date is needed.");
    }

    let name = form.name || "untitled clock";

    return { name, start, end, count };
  }

  validate(form: IForm) {
    try {
      let clock = this.formToClock(form);
      this.setState({ form, clock, error: "" });
    } catch (err) {
      if (err instanceof EditorError) {
        this.setState({
          error: err.message,
          form,
        });
      } else {
        this.setState({ form });
        throw err;
      }
    }
  }

  onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const target = event.target;
    const name = target.name;
    let value = target.type === "checkbox" ? target.checked : target.value;

    let form = { ...this.state.form, [name]: value };
    this.validate(form);
  }

  onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log("sub");

    if (this.state.clock._id) {
      // edit
    } else {
      dentifrice.createClock(this.state.clock);
      // post
    }
  }

  render() {
    return (
      <React.Fragment>
        <form className="clockEditor" onSubmit={(e) => this.onSubmit(e)}>
          <label className="nameSection">
            <p>How do you wanna call your new clock?</p>
            <input
              onChange={(e) => this.onChange(e)}
              value={this.state.form.name || ""}
              type="text"
              name="name"
            />
          </label>

          <div className="start">
            {/* <label>
              <p>
                Has a defined start&nbsp;
                <input
                  onChange={(e) => this.onChange(e)}
                  checked={this.state.form.hasStart || false}
                  type="checkbox"
                  name="hasStart"
                ></input>
              </p>
            </label> */}
            When does it <b>start</b>?
            <br />
            <br />
            <label>
              <p>
                date:{" "}
                <input
                  onChange={(e) => this.onChange(e)}
                  value={this.state.form.startdate || ""}
                  type="date"
                  name="startdate"
                />
              </p>
            </label>
            <label>
              <p>
                time:{" "}
                <input
                  onChange={(e) => this.onChange(e)}
                  value={this.state.form.starttime || ""}
                  type="time"
                  name="starttime"
                />
              </p>
            </label>
          </div>

          <div className="end">
            {/* <label>
              <p>
                Has a defined ending&nbsp;
                <input
                  onChange={(e) => this.onChange(e)}
                  checked={this.state.form.hasEnd || false}
                  type="checkbox"
                  name="hasEnd"
                ></input>
              </p>
            </label> */}
            When does it <b>end</b>?
            <br />
            <br />
            <label>
              <p>
                date:{" "}
                <input
                  onChange={(e) => this.onChange(e)}
                  value={this.state.form.enddate || ""}
                  type="date"
                  name="enddate"
                />
              </p>
            </label>
            <label>
              <p>
                time:{" "}
                <input
                  onChange={(e) => this.onChange(e)}
                  value={this.state.form.endtime || ""}
                  type="time"
                  name="endtime"
                />
              </p>
            </label>
          </div>

          <div className="updownselection">
            <label>
              <input
                checked={this.state.form.count === "UP"}
                onChange={(e) => this.onChange(e)}
                type="radio"
                // id="up"
                name="count"
                value="UP"
              />{" "}
              &nbsp;
              <b>Count up</b> from start date.
            </label>

            <br />

            <label>
              <input
                checked={this.state.form.count === "DOWN"}
                onChange={(e) => this.onChange(e)}
                type="radio"
                // id="down"
                name="count"
                value="DOWN"
              />{" "}
              &nbsp;
              <b>Count down</b> to end date.
            </label>
          </div>

          <div className="preview">
            {this.state.error || <ClockCard clock={this.state.clock} />}
          </div>

          <div className="validate">
            {/* {this.state.missing?.date && <p>Date is missing</p>}
            {this.state.missing?.name && <p>name is missing</p>}
            {this.state.missing?.direction && <p>direction is missing</p>} */}
            {!this.state.error && <button>Looks good!</button>}
          </div>
        </form>
      </React.Fragment>
    );
  }
}
