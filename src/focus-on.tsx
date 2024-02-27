import { showToast, Toast, ActionPanel, Action, Detail, getPreferenceValues, Form, useNavigation } from "@raycast/api";
import React, { useEffect, useState } from "react";

interface Preferences {
  remindersEnabled: boolean;
  reminderInterval: number;
}

interface Task {
  name: string;
  startTime: Date;
  endTime?: Date;
}

function FocusOn() {

  const { push } = useNavigation();
  const startFocusSession = (taskDescription: string) => {
    push(<FocusSession initialTask={taskDescription} />);
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Start Focusing" onSubmit={(values) => startFocusSession(values.taskDescription)} />
        </ActionPanel>
      }
    >
      <Form.TextField id="taskDescription" title="Task Description" placeholder="Enter your focus task..." />
    </Form>
  );
}

function NewTaskForm({ onNewTask }: { onNewTask: (taskName: string) => void }) {
  const [taskName, setTaskName] = useState("");
  const { pop } = useNavigation();

  const submitNewTask = () => {
    if (!taskName.trim()) {
      showToast(Toast.Style.Failure, "Task name cannot be empty");
      return;
    }
    onNewTask(taskName);
    pop(); // Close the form after submitting
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action title="Add New Task" onAction={submitNewTask} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="newTaskName"
        title="New Task Name"
        placeholder="Enter new focus task..."
        value={taskName}
        onChange={setTaskName}
      />
    </Form>
  );
}

function FocusSession({ initialTask }: { initialTask: string }) {

const { push } = useNavigation();

  const [tasks, setTasks] = useState<Task[]>([{ name: initialTask, startTime: new Date() }]);
  const [sessionEnded, setSessionEnded] = useState<boolean>(false);
  const preferences: Preferences = getPreferenceValues<Preferences>();
  const reminderInterval = preferences.reminderInterval * 60 * 1000; // Convert minutes to milliseconds

  const changeFocus = () => {
    push(<NewTaskForm onNewTask={(newTaskName) => {
      const now = new Date();
      // End the current task
      setTasks((prevTasks) => {
        const updatedTasks = [...prevTasks];
        if (updatedTasks.length > 0) {
          updatedTasks[updatedTasks.length - 1].endTime = now;
        }
        return updatedTasks;
      });
  
      // Start a new task
      setTasks((prevTasks) => [
        ...prevTasks,
        { name: newTaskName, startTime: now },
      ]);
    }} />);
  };

  useEffect(() => {
    if (preferences.remindersEnabled) {
      const reminder = setInterval(() => {
        showToast(Toast.Style.Success, "Reminder", `Refocus on your task: ${tasks[tasks.length - 1].name}`);
      }, reminderInterval);

      return () => clearInterval(reminder); // Clean up the interval on component unmount
    }
  }, [tasks, preferences.remindersEnabled, reminderInterval]);

  const endFocusSession = () => {
    const now = new Date();
    setTasks((prevTasks) => {
      const updatedTasks = [...prevTasks];
      updatedTasks[updatedTasks.length - 1].endTime = now;
      return updatedTasks;
    });
    setSessionEnded(true);
  };

  if (sessionEnded) {
   // Calculate total focus time and recommended break
   const totalFocusTimeMinutes = tasks.reduce((total, task) => {
    const endTime = task.endTime ? task.endTime.getTime() : new Date().getTime();
    return total + (endTime - task.startTime.getTime()) / 60000; // Convert milliseconds to minutes
  }, 0);
  const recommendedBreakMinutes = totalFocusTimeMinutes * 0.25; // 25% of total focus time

  // Generate session summary for display, including recommended break time
  const summary = tasks.map((task, index) => {
    const duration = ((task.endTime?.getTime() ?? new Date().getTime()) - task.startTime.getTime()) / 60000; // Duration in minutes
    return `${index + 1}. ${task.name}: ${duration.toFixed(2)} minutes`;
  }).join("\n");

  return (
    <Detail
      markdown={`# Session Summary\n${summary}\n\n### Recommended Break\nTake a break for ${recommendedBreakMinutes.toFixed(2)} minutes.`}
    />
  );
}


const TimeElapsedIndicator = () => {
  
    const timeElapsed = tasks.length > 0 ? (new Date().getTime() - tasks[tasks.length - 1].startTime.getTime()) / 60000 : 0; // Elapsed time in minutes

    const [elapsedTime, setElapsedTime] = useState(timeElapsed);
    
    // Set up a use effect to update the time elapsed every second
    useEffect(() => {
      const interval = setInterval(() => {
        setElapsedTime((prevElapsedTime) => prevElapsedTime + 1);
      }, 1000);
      return () => clearInterval(interval); // Clean up the interval on component unmount
    }, []);

    return (
      <Detail markdown={`Time Elapsed: ${timeElapsed.toFixed(1)} minutes`}/>
    )
  }

  return (
    <>
    <Detail
      markdown={`# Focusing On: ${tasks[tasks.length - 1].name}`}
      actions={
        <ActionPanel>
          <Action title="Change Focus" onAction={changeFocus} />
          <Action title="End Focus Session" onAction={endFocusSession} />
          {/* Change Focus action and reminder setup omitted for brevity */}
        </ActionPanel>
      }
      />
      <TimeElapsedIndicator />
  </>
)}

export default FocusOn