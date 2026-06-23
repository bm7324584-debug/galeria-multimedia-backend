const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors());

// =========================
// CREAR CARPETA UPLOADS
// =========================

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads', { recursive: true });
}

app.use('/uploads', express.static('uploads'));

// =========================
// CONEXIÓN MONGODB
// =========================

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ MongoDB conectado'))
.catch(err => console.error('❌ Error MongoDB:', err));

// =========================
// MULTER
// =========================

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

// =========================
// ESQUEMA
// =========================

const MultimediaSchema = new mongoose.Schema({

    titulo: {
        type: String,
        required: true
    },

    descripcion: {
        type: String,
        default: ''
    },

    imagenUrl: {
        type: String,
        default: ''
    },

    audioUrl: {
        type: String,
        default: ''
    },

    fechaCreacion: {
        type: Date,
        default: Date.now
    }

});

const Multimedia = mongoose.model(
    'Multimedia',
    MultimediaSchema
);

// =========================
// RUTA PRINCIPAL
// =========================

app.get('/', (req, res) => {

    res.json({
        mensaje: 'API Multimedia funcionando correctamente'
    });

});

// =========================
// OBTENER TODOS
// =========================

app.get('/multimedia', async (req, res) => {

    try {

        const elementos = await Multimedia
            .find()
            .sort({ fechaCreacion: -1 });

        res.json(elementos);

    } catch (error) {

        res.status(500).json({
            error: error.message
        });
    }
});

// =========================
// OBTENER UNO
// =========================

app.get('/multimedia/:id', async (req, res) => {

    try {

        const elemento = await Multimedia.findById(
            req.params.id
        );

        if (!elemento) {

            return res.status(404).json({
                mensaje: 'Elemento no encontrado'
            });
        }

        res.json(elemento);

    } catch (error) {

        res.status(500).json({
            error: error.message
        });
    }
});

// =========================
// CREAR
// =========================

app.post(
    '/multimedia',
    upload.fields([
        { name: 'imagen', maxCount: 1 },
        { name: 'audio', maxCount: 1 }
    ]),
    async (req, res) => {

        try {

            const imagen =
                req.files?.imagen?.[0]?.filename || '';

            const audio =
                req.files?.audio?.[0]?.filename || '';

            const nuevo = new Multimedia({

                titulo: req.body.titulo,

                descripcion: req.body.descripcion,

                imagenUrl: imagen
                    ? `/uploads/${imagen}`
                    : '',

                audioUrl: audio
                    ? `/uploads/${audio}`
                    : ''

            });

            await nuevo.save();

            res.status(201).json({
                mensaje: 'Elemento creado correctamente',
                nuevo
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: error.message
            });
        }
    }
);

// =========================
// EDITAR
// =========================

app.put('/multimedia/:id', async (req, res) => {

    try {

        const actualizado =
            await Multimedia.findByIdAndUpdate(

                req.params.id,

                {
                    titulo: req.body.titulo,
                    descripcion: req.body.descripcion
                },

                {
                    new: true
                }
            );

        if (!actualizado) {

            return res.status(404).json({
                mensaje: 'Elemento no encontrado'
            });
        }

        res.json({
            mensaje: 'Elemento actualizado correctamente',
            actualizado
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });
    }
});

// =========================
// ELIMINAR
// =========================

app.delete('/multimedia/:id', async (req, res) => {

    try {

        const eliminado =
            await Multimedia.findByIdAndDelete(
                req.params.id
            );

        if (!eliminado) {

            return res.status(404).json({
                mensaje: 'Elemento no encontrado'
            });
        }

        res.json({
            mensaje: 'Elemento eliminado correctamente'
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });
    }
});

// =========================
// SERVIDOR
// =========================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `🚀 Servidor ejecutándose en puerto ${PORT}`
    );

});