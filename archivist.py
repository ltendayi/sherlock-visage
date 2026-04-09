#!/usr/bin/env python3
"""
Hermes-Amara Archivist - Simple file indexing system for vector memory.
Indexes all files in /home/tendayi/Hermes-Amara for instant context retrieval.
"""

import os
import sys
import json
from pathlib import Path


class SimpleArchivist:
    """Simple file indexing system for Hermes-Amara workspace."""
    
    def __init__(self, workspace_path="/home/tendayi/Hermes-Amara"):
        self.workspace = Path(workspace_path)
        self.index_file = self.workspace / ".hermes_index.json"
        self.index = self.load_index()
    
    def load_index(self):
        """Load existing index or create new."""
        if self.index_file.exists():
            try:
                with open(self.index_file, 'r') as f:
                    return json.load(f)
            except:
                return {"files": {}, "metadata": {}}
        return {"files": {}, "metadata": {}}
    
    def save_index(self):
        """Save index to file."""
        with open(self.index_file, 'w') as f:
            json.dump(self.index, f, indent=2)
    
    def index_file_content(self, file_path, content_preview):
        """Index a file with preview content."""
        rel_path = str(file_path.relative_to(self.workspace))
        self.index["files"][rel_path] = {
            "path": rel_path,
            "size": file_path.stat().st_size,
            "modified": file_path.stat().st_mtime,
            "preview": content_preview[:500] if content_preview else "",
            "type": file_path.suffix
        }
    
    def build_index(self):
        """Build index of all files in workspace."""
        print(f"🔍 Indexing {self.workspace}...")
        
        text_extensions = {'.py', '.js', '.ts', '.java', '.cpp', '.c', '.h', 
                          '.html', '.css', '.json', '.yml', '.yaml', '.md',
                          '.txt', '.csv', '.sql', '.sh', '.bash'}
        
        file_count = 0
        for root, dirs, files in os.walk(self.workspace):
            # Skip hidden directories
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            
            for file in files:
                file_path = Path(root) / file
                if file.startswith('.'):
                    continue
                    
                try:
                    # Try to read text files for preview
                    content_preview = ""
                    if file_path.suffix in text_extensions:
                        try:
                            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                                content_preview = f.read(500)
                        except:
                            content_preview = "[binary or encoding issue]"
                    
                    self.index_file_content(file_path, content_preview)
                    file_count += 1
                    
                    if file_count % 100 == 0:
                        print(f"  Indexed {file_count} files...")
                        
                except Exception as e:
                    print(f"  Skipping {file_path}: {e}")
        
        self.save_index()
        print(f"✅ Indexed {file_count} files")
        print(f"📁 Index saved to: {self.index_file}")
        return file_count
    
    def search(self, query):
        """Simple search by filename and content preview."""
        results = []
        query_lower = query.lower()
        
        for file_info in self.index["files"].values():
            if (query_lower in file_info["path"].lower() or 
                query_lower in file_info["preview"].lower()):
                results.append(file_info)
        
        return sorted(results, key=lambda x: x["modified"], reverse=True)
    
    def get_stats(self):
        """Get indexing statistics."""
        total_files = len(self.index["files"])
        file_types = {}
        for info in self.index["files"].values():
            ext = info["type"]
            file_types[ext] = file_types.get(ext, 0) + 1
        
        return {
            "total_files": total_files,
            "file_types": file_types,
            "index_size_kb": os.path.getsize(self.index_file) / 1024 if self.index_file.exists() else 0
        }


if __name__ == "__main__":
    archivist = SimpleArchivist()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == "index":
            archivist.build_index()
        elif command == "search" and len(sys.argv) > 2:
            query = sys.argv[2]
            results = archivist.search(query)
            print(f"🔍 Search results for '{query}':")
            for result in results[:10]:
                print(f"  {result['path']} ({result['type']})")
                if result['preview']:
                    print(f"    Preview: {result['preview'][:100]}...")
        elif command == "stats":
            stats = archivist.get_stats()
            print(f"📊 Index Statistics:")
            print(f"  Total files: {stats['total_files']}")
            print(f"  Index size: {stats['index_size_kb']:.1f} KB")
            print(f"  File types:")
            for ext, count in sorted(stats['file_types'].items(), key=lambda x: x[1], reverse=True)[:10]:
                print(f"    {ext}: {count}")
        else:
            print("Usage: python3 archivist.py [index|search <query>|stats]")
    else:
        print("Hermes-Amara Archivist System")
        print("Usage: python3 archivist.py [index|search <query>|stats]")