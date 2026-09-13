import os
import zipfile
import sys

def create_project_zip(output_path="dist/lets-estimate-2.0-source.zip"):
    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    
    ignore_dirs = {
        'node_modules',
        'dist',
        '.git',
        '.cache',
        '.vscode',
        'tmp'
    }
    
    ignore_extensions = {
        '.log',
        '.tmp',
        '.zip'
    }

    print(f"Creating ZIP archive from {root_dir}...")
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(root_dir):
            # Modify dirs in-place to prevent walking ignored folders
            dirs[:] = [d for d in dirs if d not in ignore_dirs and not d.startswith('.')]
            
            for file in files:
                if any(file.endswith(ext) for ext in ignore_extensions):
                    continue
                if file.startswith('.') and file not in ['.env.example', '.gitignore']:
                    continue
                
                full_path = os.path.join(root, file)
                # Don't include the output zip if it's in the tree
                if os.path.abspath(full_path) == os.path.abspath(output_path):
                    continue
                    
                rel_path = os.path.relpath(full_path, root_dir)
                zipf.write(full_path, rel_path)
                
    file_size = os.path.getsize(output_path)
    print(f"ZIP created successfully at {output_path} ({file_size / 1024:.1f} KB)")
    return output_path

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "dist/lets-estimate-2.0-source.zip"
    create_project_zip(out)
