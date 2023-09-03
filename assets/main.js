
const taskSettings = [
    {
        name: "作業1",
        isInput: false,
        key: "",
        value: "",
        caption: "",
    },
    {
        name: "作業2",
        isInput: false,
        key: "",
        value: "",
        caption: "",
    },
    {
        name: "定期作業1",
        isInput: false,
        key: "",
        value: "",
        caption: "",
    },
    {
        name: "定期作業2",
        isInput: false,
        key: "",
        value: "",
        caption: "",
    },
    {
        name: "終了作業",
        isInput: false,
        key: "",
        value: "",
        caption: "",
    },
    {
        name: "月1作業1",
        isInput: false,
        key: "",
        value: "",
        caption: "",
    },
    {
        name: "月1作業2",
        isInput: false,
        key: "",
        value: "",
        caption: "",
    },
]


const container = document.getElementById("button_container");
const timeline = document.getElementById("timeline");

const taskObserver = new TaskObserver(taskSettings, container, timeline);

const aa = (currentTask) => {

    const task = taskObserver.getUnCompleteCurrentTask();

    if (task != undefined && task.state != TaskState.Stop) {

        document.getElementById("label_currentTask").innerText = task.name;
        if (task.state == TaskState.Pause) document.getElementById("label_currentState").innerText = "保留中";
        if (task.state < TaskState.Pause) document.getElementById("label_currentState").innerText = "進行中";
    }
    else {
        document.getElementById("label_currentTask").innerText = "なし";
        document.getElementById("label_currentState").innerText = "";
    }

    const button_report = document.getElementById("button_report");
    const button_pause = document.getElementById("button_pause");
    const button_stop = document.getElementById("button_stop");

    button_report.setAttribute("disabled", "");
    button_pause.setAttribute("disabled", "");
    button_stop.setAttribute("disabled", "");

    if (task != undefined && task.state < TaskState.Pause)  {
        button_report.removeAttribute("disabled");
        button_pause.removeAttribute("disabled");
        button_stop.removeAttribute("disabled");
    }
}


function clickReport() {
    taskObserver.setReportText(document.getElementById("input_report").value);
    resetReportInput();
}

function resetReportInput() {
    document.getElementById("input_report").value = "";
}

function clickTotalTaskInfo() {
    console.log(taskObserver.totalTaskInfo());
}

function clickTaskResume() {
    taskObserver.resumeCurrentTask();
}

function clickTaskStop() {
    taskObserver.stopCurrentTask();
}

taskObserver.addEventListener(taskObserver.eventNames.changeTaskState, aa);