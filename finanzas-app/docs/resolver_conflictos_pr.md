# Resolver conflictos en tu PR (paso a paso)

Cuando GitHub muestra **"This branch has conflicts"**, significa que tu rama y `main` tocaron los mismos archivos.

## Opción recomendada (línea de comandos)

### 1) Traer últimos cambios

```bash
git fetch origin
```

### 2) Ir a tu rama del PR

```bash
git checkout <tu-rama>
```

### 3) Mezclar `main` en tu rama

```bash
git merge origin/main
```

### 4) Resolver conflictos

Abrí los archivos en conflicto y buscá bloques como:

```text
<<<<<<< HEAD
...tu versión...
=======
...versión de main...
>>>>>>> origin/main
```

Dejá el contenido correcto, borra esas marcas y guardá.

### 5) Confirmar resolución

```bash
git add .
git commit -m "Resuelve conflictos con main"
git push
```

## Si usás GitHub Web

También podés hacer click en **Resolve conflicts**, editar en web, y confirmar.
