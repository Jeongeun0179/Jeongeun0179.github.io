const canvas = document.getElementById('glCanvas'); 
const gl = canvas.getContext('webgl2'); 

if (!gl) {
    console.error('WebGL 2 is not supported by your browser.');
}


canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 파랑
gl.viewport(0, 250, 250, 250);
gl.scissor(0, 250, 250, 250);
gl.enable(gl.SCISSOR_TEST);
gl.clearColor(0.0, 0.0, 1.0, 1.0);
render();

// 초록
gl.viewport(250, 250, 250, 250);
gl.scissor(250, 250, 250, 250);
gl.enable(gl.SCISSOR_TEST);
gl.clearColor(0.0, 1.0, 0.0, 1.0);
render();

// 노랑
gl.viewport(250, 0, 250, 250);
gl.scissor(250, 0, 250, 250);
gl.enable(gl.SCISSOR_TEST);
gl.clearColor(1.0, 1.0, 0.0, 1.0);
render();

// 빨강
gl.viewport(0, 0, 250, 250);
gl.scissor(0, 0, 250, 250);
gl.enable(gl.SCISSOR_TEST);
gl.clearColor(1.0, 0.0, 0.0, 1.0);
render();


// Render loop
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);    
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let minSize;
    if (canvas.width < canvas.height) {
        minSize = canvas.width / 2;
    } else {
        minSize = canvas.height / 2;
    }
    
    // 파랑
    gl.viewport(0, minSize, minSize, minSize);
    gl.scissor(0, minSize, minSize, minSize);
    gl.clearColor(0.0, 0.0, 1.0, 1.0);
    render();

    // 초록
    gl.viewport( minSize, minSize, minSize, minSize);
    gl.scissor(minSize, minSize, minSize, minSize);
    gl.clearColor(0.0, 1.0, 0.0, 1.0);
    render();

    // 노랑
    gl.viewport(minSize, 0, minSize, minSize);
    gl.scissor(minSize, 0, minSize, minSize);
    gl.clearColor(1.0, 1.0, 0.0, 1.0);
    render();

    // 빨강
    gl.viewport(0, 0, minSize, minSize);
    gl.scissor(0, 0, minSize, minSize);
    gl.clearColor(1.0, 0.0, 0.0, 1.0);
    render();
});

