const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors());

app.use('/uploads', express.static('uploads'));

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB conectado'))
.catch(err => console.error(err));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(
            null,
            Date.now() +
            '-' +
            file.originalname.replace(/\s+/g, '_')
        );
    }
});

const upload = multer({ storage });

const MultimediaSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: true
    },
    descripcion: String,
    imagenUrl: String,
    audioUrl: String,
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
});

const Multimedia = mongoose.model(
    'Multimedia',
    MultimediaSchema
);

app.get('/multimedia', async (req, res) => {
    try {
        const elementos = await Multimedia.find()
            .sort({ fechaCreacion: -1 });

        res.json(elementos);
    } catch (error) {
        res.status(500).json(error);
    }
});

app.post(
    '/multimedia',
    upload.fields([
        { name: 'imagen', maxCount: 1 },
        { name: 'audio', maxCount: 1 }
    ]),
    async (req, res) => {
        try {

            const imagen =
                req.files.imagen?.[0]?.filename || '';

            const audio =
                req.files.audio?.[0]?.filename || '';

            const nuevo = new Multimedia({
                titulo: req.body.titulo,
                descripcion: req.body.descripcion,
                imagenUrl: `/uploads/${imagen}`,
                audioUrl: `/uploads/${audio}`
            });

            await nuevo.save();

            res.json({
                mensaje: 'Guardado correctamente',
                nuevo
            });

        } catch (error) {
            res.status(500).json(error);
        }
    }
);

app.delete('/multimedia/:id', async (req, res) => {
    try {

        await Multimedia.findByIdAndDelete(
            req.params.id
        );

        res.json({
            mensaje: 'Eliminado correctamente'
        });

    } catch (error) {
        res.status(500).json(error);
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(
        `Servidor ejecutándose en puerto ${PORT}`
    );
});