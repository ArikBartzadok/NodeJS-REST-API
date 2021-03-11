const express = require('express')
const authMiddleware = require('../middlewares/auth')

const Project = require('../models/Project')
const Task = require('../models/Task')

const router = express.Router()

router.use(authMiddleware)

router.get('/', async (req, res) => {
    try {
        const projects = await Project.find().populate(['user', 'tasks'])
        return res.send({ projects })
    } catch {
        return res.status(400).send({ error : 'Error loading projects'})
    }
})

router.get('/:projectId', async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId).populate(['user', 'tasks'])
        return res.send({ project })
    } catch {
        return res.status(400).send({ error : 'Error loading project'})
    }
})

router.post('/', async (req, res) => {
    try {
        const { title, description, tasks} = req.body
        // Criando o projeto, e após criar, salvando as tasks uma por uma
        const project = await Project.create({ title, description, user: req.userId})
        await Promise.all(tasks.map(async task => {
            // new (prefix) Vs. .save() ? save -> salva na hora, 'new' não salva na hora
            const projectTask = new Task({ ...task, project: project._id})
            // capturando e salvando uma por uma
            await projectTask.save()
            project.tasks.push(projectTask)
        }))
        // Esperando todas as promessas de taks rodarem, para depois salvar
        await project.save()
        return res.send({ project })
    } catch (error) {
        console.log(error);
        return res.status(400).send({ error : 'Error creating new project'})
    }
})

router.put('/:projectId', async (req, res) => {
    try {
        const { title, description, tasks} = req.body
        // Criando o projeto, e após criar, salvando as tasks uma por uma
        const project = await Project.findByIdAndUpdate(req.params.projectId, { 
            title, 
            description
        }, { new: true }) // new true, retorna o valor atualizado (por padrão é falso no mongoose)
        // Removendo todas as taks criadas anteriormente, e depois criando-as
        project.tasks = []
        await Task.deleteOne({ project: project._id})
        await Promise.all(tasks.map(async task => {
            // new (prefix) Vs. .save() ? save -> salva na hora, 'new' não salva na hora
            const projectTask = new Task({ ...task, project: project._id})
            // capturando e salvando uma por uma
            await projectTask.save()
            project.tasks.push(projectTask)
        }))
        // Esperando todas as promessas de taks rodarem, para depois salvar
        await project.save()
        return res.send({ project })
    } catch (error) {
        console.log(error);
        return res.status(400).send({ error : 'Error to update project'})
    }
})

router.delete('/:projectId', async (req, res) => {
    try {
        await Project.findByIdAndRemove(req.params.projectId)
        return res.send() //OK 200
    } catch {
        return res.status(400).send({ error : 'Error deleting project'})
    }
})

module.exports = app => app.use('/projects', router)