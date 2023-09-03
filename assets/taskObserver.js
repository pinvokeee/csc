TaskState = {
    Report: -1,
    Start: 0,
    Restart: 1,
    Pause: 2,
    Stop: 99,
}

class TaskObserver { 

    // TaskState = {
    //     Report: -1,
    //     Start: 0,
    //     Restart: 1,
    //     Pause: 2,
    //     Stop: 99,
    // }

    eventNames = {
        changeTaskState: "changeTaskState",
    }

    events = {
        [this.eventNames.changeTaskState]: undefined,
    }

    constructor(taskSettings, controlContainerElement, timelineContainerElement) {

        this.log = [];
        this.taskSettings = taskSettings;
        this.containerElement = controlContainerElement;
        this.timelineElement = timelineContainerElement;

        this.timeline = new TimelineViewer(this.timelineElement);

        this.buttons = [];

        this.DefaultTaskButtonClass = "btn d-flex align-items-center mb-auto mb-lg-0 text-start w-100";    

        this.initialize();
    }

    //初期化
    initialize = () => {

        for (const task of this.taskSettings) {

            const block = document.createElement("div");
            const name = task.name;
        
            const taskButton = document.createElement("button");
            taskButton.value = name;
            taskButton.innerText = name;
            taskButton.type = "button";
            taskButton.className = `${this.DefaultTaskButtonClass} btn-outline-secondary`;
        
            taskButton.addEventListener("click", this.clickTask);
    
            const reportText = document.createElement("span");
            reportText.className = "badge";

            const state = document.createElement("span");
            state.className = "badge";
            
            const stateBlock = document.createElement("div");
            stateBlock.className = "ms-auto"
            stateBlock.appendChild(reportText);            
            stateBlock.appendChild(state);

            taskButton.appendChild(stateBlock);            
            block.appendChild(taskButton);
            
            this.buttons.push( { taskButton, reportText, state });

            this.containerElement.appendChild(block);
        }

        this.refreshButtons();
    }

    refreshButtons = () => {
        
        for (const bst of this.buttons) {

            const button = bst.taskButton;
            const stateBadge = bst.state;
            const report = bst.reportText;
            const name = button.value;
            const task = this.getCurrentTaskFromName(name);
            const reportTask = this.getCurrentTaskReportText(name);

            if (task == undefined || task.state == TaskState.Stop) {
                button.className = `${this.DefaultTaskButtonClass} btn-outline-secondary btn_start`;
                stateBadge.innerText = "";
                report.innerText = "";
            }

            if (task != undefined && (task.state == TaskState.Start || task.state == TaskState.Restart)) {
                button.className = `${this.DefaultTaskButtonClass} btn-success btn_pause position-relative`;
                stateBadge.className = "badge ms-auto";
                stateBadge.innerText = "進行中";
            }

            if (task != undefined && task.state == TaskState.Pause) {
                button.className = `${this.DefaultTaskButtonClass} btn-primary btn_start position-relative`;
                stateBadge.className = "badge ms-auto";
                stateBadge.innerText = "保留中";
            }

            report.innerText = reportTask != undefined ? reportTask.reportText : "";            
        }

    }

    clickTask = (e) => {

        const button = e.target;
        const name = button.value;

        if (button.value == undefined) return;

        this.newTask(name);
        this.refreshButtons();

        console.log(this.log);
    }

    setReportText = (text) => {
        this.newReport(text);
        this.refreshButtons();
        console.log(this.log);
    }

    addEventListener = (eventName, func) => {
        this.events[eventName] = func;
    }

    totalTaskInfo = () => {

        const list = {}

        for (const task of this.log) {
            if (list[task.name] == undefined) list[task.name] = { timestamp: undefined, time: 0 };
            const last = list[task.name];

            if (task.state == TaskState.Start || task.state == TaskState.Restart) {
                last.timestamp = task.timestamp;
            }

            if (task.state == TaskState.Pause || task.state == TaskState.Stop) {
                last.time += task.timestamp.getTime() - last.timestamp.getTime();
                last.timestamp = undefined;
            }
        }

        for (const key of Object.keys(list)) {
            const task = list[key];

            if (task.timestamp != undefined) {
                task.time = (new Date()).getTime() - task.timestamp.getTime();
            }
        }

        console.log(list);
    }

    newTask = (name) => {

        const currentTask = this.getCurrentTask();

        if (currentTask == undefined || currentTask.name != name) {

            this.resumeTask(currentTask);

            const eqNameTask = this.getCurrentTaskFromName(name);
            let state = TaskState.Start;

            if (eqNameTask != undefined && eqNameTask.state == TaskState.Pause) {
                state = TaskState.Restart;
            }

            this.addStamp( name, new Date(), state);
        }
        
        if (currentTask != undefined && currentTask.name == name) {

            let state = TaskState.Start;

            if (currentTask.state == TaskState.Pause) {
                state = TaskState.Restart;
            }
            else if (currentTask.state < TaskState.Pause) {
                state = TaskState.Pause;
            }

            this.addStamp(name, new Date(), state);
        }
        
        this.timeline.draw(this.log);

        this.changeState();
    }

    getCurrentTaskFromName = (name) => {
        for (let i = this.log.length - 1; i > -1; i--) {
            const task = this.log[i];
            if (task.name == name) { 
                return task;
            }
        }

        return undefined;
    }
    
    getCurrentTaskReportText = (name) => {
        for (let i = this.log.length - 1; i > -1; i--) {
            const task = this.log[i];

            if (task.name == name) {
                if (task.state == TaskState.Stop) return undefined;
                if (task.state == TaskState.Report) return task;
            }
        }

        return undefined;
    }

    changeState = () => {
        this.refreshButtons();
        this.events.changeTaskState?.call(this, this.getCurrentTask());
    }

    getCurrentTask = () => {
        if (this.log.length == 0) return undefined;
        return this.log[this.log.length - 1];
    }

    //未完了の直近タスク取得
    getUnCompleteCurrentTask = () => {

        if (this.log.length == 0) return undefined;
        
        const states = [];

        for (const task of this.log) {

            if (task.state < TaskState.Stop) {
                for (let i = states.length - 1; i > -1; i--) {
                    if (task.name == states[i].name) {
                        states.splice(i, 1);
                        break;
                    }
                }

                states.push(task);
            }
        
            if (task.state == TaskState.Stop) {
                states.pop();
            }
        }

        return states.pop();
    }

    newReport = (text) => {
        const currentTask = this.getCurrentTask();
        this.addStamp(currentTask.name, new Date(), TaskState.Report, text);     
        this.changeState();
    }

    resumeCurrentTask = () => {
        this.resumeTask(this.getCurrentTask());
    }

    stopCurrentTask = () => {
        this.stopTask(this.getCurrentTask());
    }

    resumeTask = (task) => {

        //タスクがなければ終了
        if (task == undefined) return;
        //停止済み・一時停止中なら終了
        if (task.state >= TaskState.Pause) return;

        this.addStamp(task.name, new Date(), TaskState.Pause);
        this.changeState();
    }

    stopTask = (task) => {

        //タスクがなければ終了
        if (task == undefined) return;
        //停止済みなら終了
        if (task.state >= TaskState.Stop) return;

        this.addStamp(task.name, new Date(), TaskState.Stop);
        this.changeState();
    }

    addStamp = (name, timestamp, state, reportText) => {
        this.log.push({ name, timestamp, state, reportText });
    }
}

class TimelineViewer {

    constructor (element) {
        this.element = element;
    }

    groupBy = (arr, key, newKeyFunc) => {

        return arr.reduce((x, y) => {
            const newkey = newKeyFunc(key);
            // if (x[y[newkey]] == x[y[newkey]] || []).push()
        }, {});
    }

    groupingTaskFromDate = (log) => {

        // const dates = {};

        // this.groupBy(log, "timestamp", (date) => )


        // for (const task of log) {
        //     const date = task.timestamp;
        //     const key = new Date(`${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}`);            
        //     if (dates[key] == undefined) dates[key] = [];
        //     dates[key].push(task);
        // }

        console.log(dates);
    }

    getTimeRange = () => {

    }

    draw = (taskLog) => {

        while (this.element.firstElementChild != null) {
            this.element.firstElementChild.remove();
        }

        let lastTask = undefined;
        let elements = {             
        };

        console.log(this.groupingTaskFromDate(taskLog));

        for (const task of taskLog) {

            if (lastTask == undefined || task.timestamp.getDate() != lastTask.timestamp.getDate()) {                
                const ts = task.timestamp;
                const dayMarker = document.createElement("div");
                dayMarker.innerText = `${ts.getFullYear()}年${ts.getMonth()+1}月${ts.getDate()}日`;
                this.element.appendChild(dayMarker);

                elements = {
                    panel: document.createElement("div"),
                    hours: document.createElement("div"),
                    tasks: document.createElement("div"),
                }

                elements.panel.style = "display:grid;grid-template-columns:auto 1fr;"
                elements.hours.style = "border-right: 1px solid gray";

                elements.panel.appendChild(elements.hours);
                elements.panel.appendChild(elements.tasks);
                
                this.element.appendChild(elements.panel);
            }

            if (lastTask != undefined) {

                if (task.state >= TaskState.Pause) {

                    if (lastTask.timestamp.getHours() != task.timestamp.getHours()) {
                        const t = document.createElement("div");
                        t.innerText = "10:00";
    
                        elements.hours.appendChild(t);
                    }

                }
            }

            lastTask = task;
        }

        if (lastTask.state < TaskState.Pause) {

        }

    }

}