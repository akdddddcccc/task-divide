import React, { useState } from 'react'

// 任务类型定义
interface Task {
  id: string
  title: string
  description: string
  startTime: string
  deadline: string
  status: 'pending' | 'in-progress' | 'completed'
  children: Task[]
  dependency?: string // 依赖的任务ID
}

function App() {
  // 初始任务数据
  const [tasks, setTasks] = useState<Task[]>([])
  // 模态框状态
  const [showModal, setShowModal] = useState(false)
  // 当前编辑的任务
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  // 父任务ID
  const [parentTaskId, setParentTaskId] = useState<string | null>(null)

  // 生成唯一ID
  const generateId = () => Math.random().toString(36).slice(2, 11)

  // 打开添加任务模态框
  const openAddTaskModal = (parentId: string | null = null) => {
    setParentTaskId(parentId)
    setCurrentTask({
      id: generateId(),
      title: '',
      description: '',
      startTime: '',
      deadline: '',
      status: 'pending',
      children: []
    })
    setShowModal(true)
  }

  // 打开编辑任务模态框
  const openEditTaskModal = (task: Task) => {
    setCurrentTask({ ...task })
    setShowModal(true)
  }

  // 关闭模态框
  const closeModal = () => {
    setShowModal(false)
    setCurrentTask(null)
    setParentTaskId(null)
  }

  // 添加任务
  const addTask = (task: Task) => {
    // 检查任务的开始时间是否晚于截止时间
    if (task.startTime && task.deadline) {
      if (new Date(task.startTime) > new Date(task.deadline)) {
        alert('任务的开始时间不能晚于截止时间')
        return
      }
    }

    if (parentTaskId) {
      // 添加子任务
      const addChildTask = (tasks: Task[]): Task[] => {
        return tasks.map(t => {
          if (t.id === parentTaskId) {
            // 检查子任务的开始时间是否早于父任务
            if (t.startTime && task.startTime) {
              if (new Date(task.startTime) < new Date(t.startTime)) {
                alert('子任务的开始时间不能早于父任务')
                return t
              }
            }
            // 检查子任务的截止日期是否晚于父任务
            if (t.deadline && task.deadline) {
              if (new Date(task.deadline) > new Date(t.deadline)) {
                alert('子任务的截止日期不能晚于父任务')
                return t
              }
            }
            return {
              ...t,
              children: [...t.children, task]
            }
          }
          if (t.children.length > 0) {
            return {
              ...t,
              children: addChildTask(t.children)
            }
          }
          return t
        })
      }
      setTasks(addChildTask(tasks))
    } else {
      // 检查根任务的依赖关系
      if (task.dependency) {
        // 检查是否存在循环依赖
        const checkCircularDependency = (taskId: string, dependencyId: string): boolean => {
          if (taskId === dependencyId) return true
          const dependencyTask = tasks.find(t => t.id === dependencyId)
          return dependencyTask?.dependency ? checkCircularDependency(taskId, dependencyTask.dependency) : false
        }
        
        if (checkCircularDependency(task.id, task.dependency)) {
          alert('不能添加循环依赖')
          return
        }
      }
      // 添加根任务
      setTasks([...tasks, task])
    }
    closeModal()
  }

  // 更新任务
  const updateTask = (updatedTask: Task) => {
    // 检查任务的开始时间是否晚于截止时间
    if (updatedTask.startTime && updatedTask.deadline) {
      if (new Date(updatedTask.startTime) > new Date(updatedTask.deadline)) {
        alert('任务的开始时间不能晚于截止时间')
        return
      }
    }

    const updateTaskRecursive = (tasks: Task[]): Task[] => {
      return tasks.map(t => {
        if (t.id === updatedTask.id) {
          // 检查子任务的开始时间是否早于更新后的任务
          if (updatedTask.startTime) {
            const hasInvalidChildStart = updatedTask.children.some(child => {
              return child.startTime && new Date(child.startTime) < new Date(updatedTask.startTime)
            })
            if (hasInvalidChildStart) {
              alert('子任务的开始时间不能早于父任务')
              return t
            }
          }
          // 检查子任务的截止日期是否晚于更新后的任务
          if (updatedTask.deadline) {
            const hasInvalidChildDeadline = updatedTask.children.some(child => {
              return child.deadline && new Date(child.deadline) > new Date(updatedTask.deadline)
            })
            if (hasInvalidChildDeadline) {
              alert('子任务的截止日期不能晚于父任务')
              return t
            }
          }
          return updatedTask
        }
        if (t.children.length > 0) {
          return {
            ...t,
            children: updateTaskRecursive(t.children)
          }
        }
        return t
      })
    }
    setTasks(updateTaskRecursive(tasks))
    closeModal()
  }

  // 删除任务
  const deleteTask = (taskId: string) => {
    const deleteTaskRecursive = (tasks: Task[]): Task[] => {
      return tasks.filter(t => {
        if (t.id === taskId) {
          return false
        }
        if (t.children.length > 0) {
          t.children = deleteTaskRecursive(t.children)
        }
        return true
      })
    }
    setTasks(deleteTaskRecursive(tasks))
  }

  // 获取所有任务（包括子任务）
  const getAllTasks = (tasks: Task[]): Task[] => {
    let allTasks: Task[] = []
    tasks.forEach(task => {
      allTasks.push(task)
      if (task.children.length > 0) {
        allTasks = [...allTasks, ...getAllTasks(task.children)]
      }
    })
    return allTasks
  }

  // 计算甘特图的时间范围
  const getDateRange = () => {
    const allTasks = getAllTasks(tasks)
    if (allTasks.length === 0) {
      const today = new Date()
      return {
        start: new Date(today.setDate(today.getDate() - 7)),
        end: new Date(today.setDate(today.getDate() + 21))
      }
    }

    const allDates = allTasks
      .flatMap(task => {
        const dates: number[] = []
        if (task.startTime) dates.push(new Date(task.startTime).getTime())
        if (task.deadline) dates.push(new Date(task.deadline).getTime())
        return dates
      })

    if (allDates.length === 0) {
      const today = new Date()
      return {
        start: new Date(today.setDate(today.getDate() - 7)),
        end: new Date(today.setDate(today.getDate() + 21))
      }
    }

    const start = new Date(Math.min(...allDates))
    start.setDate(start.getDate() - 7)
    const end = new Date(Math.max(...allDates))
    end.setDate(end.getDate() + 7)

    return { start, end }
  }

  // 计算任务在甘特图中的位置和宽度
  const getTaskPosition = (task: Task, startDate: Date, endDate: Date) => {
    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)

    if (!task.startTime && !task.deadline) {
      return { left: 0, width: 100 }
    }

    let taskStartDate = task.startTime ? new Date(task.startTime) : startDate
    let taskEndDate = task.deadline ? new Date(task.deadline) : endDate

    const startDaysFromStart = (taskStartDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    const endDaysFromStart = (taskEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)

    const left = (startDaysFromStart / totalDays) * 100
    const width = ((endDaysFromStart - startDaysFromStart) / totalDays) * 100

    return { 
      left: Math.max(0, left), 
      width: Math.max(5, Math.min(width, 100 - left)) 
    }
  }

  // 渲染任务
  const renderTask = (task: Task, level: number = 0) => {
    // 使用固定透明度，通过叠加效应自然产生颜色深浅变化
    // 所有任务卡片使用相同的透明度，叠加时会自然产生颜色差异
    const opacity = 0.36; // 减小透明度值，增强叠加效果
    
    return (
      <div 
        key={task.id} 
        className="task" 
        style={{ 
          marginLeft: `${level * 20}px`,
          backgroundColor: `rgba(var(--task-base-color), ${opacity})`,
          borderColor: `rgba(var(--task-border-color), ${opacity})`,
          boxShadow: `0 2px 8px rgba(0, 0, 0, 0.1)`,
          color: '#333' // 确保文字颜色与背景有足够对比度
        }}
      >
        <div className="task-header">
          <div className="task-title">{task.title}</div>
          <div className="task-meta">
            <div className="task-deadline">
              {task.startTime && `开始: ${task.startTime} | `}截止: {task.deadline}
            </div>
            <div className={`task-status ${task.status}`}>
              {task.status === 'pending' ? '待处理' : task.status === 'in-progress' ? '进行中' : '已完成'}
            </div>
          </div>
        </div>
        <div className="task-description">{task.description}</div>
        <div className="task-actions">
          <button className="button button-secondary" onClick={() => openEditTaskModal(task)}>编辑</button>
          <button className="button button-secondary" onClick={() => deleteTask(task.id)}>删除</button>
          <button className="button" onClick={() => openAddTaskModal(task.id)}>添加子任务</button>
        </div>
        {task.children.length > 0 && (
          <div className="task-children">
            {task.children.map(child => renderTask(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  // 渲染甘特图
  const renderGanttChart = () => {
    const { start, end } = getDateRange()
    const allTasks = getAllTasks(tasks)

    if (allTasks.length === 0) {
      return (
        <div className="gantt-container">
          <div className="gantt-header">
            <h2 className="gantt-title">甘特图</h2>
          </div>
          <div className="gantt-chart">
            <div className="gantt-row">
              <div className="gantt-task-name">暂无任务</div>
              <div className="gantt-task-bar">
                <div style={{ textAlign: 'center', width: '100%', color: 'var(--text-secondary)' }}>
                  添加任务后将显示甘特图
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="gantt-container">
        <div className="gantt-header">
          <h2 className="gantt-title">甘特图</h2>
        </div>
        <div className="gantt-chart">
          {allTasks.map(task => {
            const { left, width } = getTaskPosition(task, start, end)
            return (
              <div key={task.id} className="gantt-row">
                <div className="gantt-task-name">{task.title}</div>
                <div className="gantt-task-bar">
                  {task.dependency && (
                    <div className="gantt-dependency-line" style={{ 
                      left: '0%', 
                      width: '100%',
                      top: '50%'
                    }} />
                  )}
                  <div 
                    className={`gantt-bar ${task.status}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    {task.deadline}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentTask) {
      if (currentTask.id && tasks.some(t => t.id === currentTask.id)) {
        updateTask(currentTask)
      } else {
        addTask(currentTask)
      }
    }
  }

  return (
    <div className="app">
      <div className="app-header">
        <h1 className="app-title">任务管理应用</h1>
        <button className="button" onClick={() => openAddTaskModal()}>添加任务</button>
      </div>
      
      <div className="tasks">
        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
            暂无任务，点击上方"添加任务"按钮创建第一个任务
          </div>
        ) : (
          tasks.map(task => renderTask(task))
        )}
      </div>

      {renderGanttChart()}

      {showModal && currentTask && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {currentTask.id && tasks.some(t => t.id === currentTask.id) ? '编辑任务' : '添加任务'}
              </h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">任务标题</label>
                <input
                  type="text"
                  id="title"
                  value={currentTask.title}
                  onChange={(e) => setCurrentTask({ ...currentTask, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">任务描述</label>
                <textarea
                  id="description"
                  value={currentTask.description}
                  onChange={(e) => setCurrentTask({ ...currentTask, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="startTime">开始时间</label>
                <input
                  type="date"
                  id="startTime"
                  value={currentTask.startTime}
                  onChange={(e) => setCurrentTask({ ...currentTask, startTime: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="deadline">截止日期</label>
                <input
                  type="date"
                  id="deadline"
                  value={currentTask.deadline}
                  onChange={(e) => setCurrentTask({ ...currentTask, deadline: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="status">状态</label>
                <select
                  id="status"
                  value={currentTask.status}
                  onChange={(e) => setCurrentTask({ ...currentTask, status: e.target.value as 'pending' | 'in-progress' | 'completed' })}
                >
                  <option value="pending">待处理</option>
                  <option value="in-progress">进行中</option>
                  <option value="completed">已完成</option>
                </select>
              </div>
              {!parentTaskId && (
                <div className="form-group">
                  <label htmlFor="dependency">依赖任务</label>
                  <select
                    id="dependency"
                    value={currentTask.dependency || ''}
                    onChange={(e) => setCurrentTask({ ...currentTask, dependency: e.target.value || undefined })}
                  >
                    <option value="">无依赖</option>
                    {tasks.map(task => (
                      <option key={task.id} value={task.id}>{task.title}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-actions">
                <button type="button" className="button button-secondary" onClick={closeModal}>取消</button>
                <button type="submit" className="button">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App