import ast
import io
import time
import math
import contextlib
import pandas as pd
import numpy as np
from typing import Tuple, Dict, Any, Optional

# Unsafe modules list
FORBIDDEN_MODULES = {
    'os', 'sys', 'subprocess', 'shutil', 'socket', 'builtins', 'importlib', 
    'requests', 'urllib', 'pty', 'platform', 'ctypes', 'gc', 'pickle', 'shelve',
    'pathlib', 'tempfile', 'inspect', 'code', 'threading', 'multiprocessing'
}

FORBIDDEN_ATTRIBUTES = {
    '__subclasses__', '__bases__', '__mro__', '__import__', '__globals__', 
    '__builtins__', '__class__'
}

def validate_code(code_str: str) -> Tuple[bool, Optional[str]]:
    """
    Parses code using AST and checks for restricted libraries, unsafe builtins, and dangerous attribute access.
    """
    try:
        tree = ast.parse(code_str)
        for node in ast.walk(tree):
            # Check import statements (e.g. import os)
            if isinstance(node, ast.Import):
                for name in node.names:
                    root_name = name.name.split('.')[0]
                    if root_name in FORBIDDEN_MODULES:
                        return False, f"Forbidden import: '{root_name}'"
            
            # Check from imports (e.g. from sys import exit)
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    root_name = node.module.split('.')[0]
                    if root_name in FORBIDDEN_MODULES:
                        return False, f"Forbidden import: '{root_name}'"
            
            # Check function calls (e.g. eval(), exec(), open(), input())
            elif isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name):
                    if node.func.id in ('eval', 'exec', 'open', 'compile', 'input', 'getattr', 'setattr', 'delattr', '__import__'):
                        return False, f"Forbidden builtin function call: '{node.func.id}()'"
            
            # Check attribute access (e.g. obj.__subclasses__)
            elif isinstance(node, ast.Attribute):
                if node.attr in FORBIDDEN_ATTRIBUTES:
                    return False, f"Forbidden attribute access: '{node.attr}'"

        return True, None
    except SyntaxError as se:
        return False, f"Syntax Error: {str(se)}"
    except Exception as e:
        return False, f"AST Parsing Error: {str(e)}"

class PythonExecutor:
    """Runs Python code securely on a Pandas DataFrame and returns stdout/local variables with execution metrics."""
    
    def execute(self, code_str: str, df: pd.DataFrame) -> Tuple[bool, str, Dict[str, Any], Optional[str], float]:
        """
        Executes code in a sandbox environment.
        Returns: (success, stdout, local_variables, error_msg, execution_time_ms)
        """
        start_time = time.perf_counter()

        # Validate syntax and imports
        is_valid, validation_err = validate_code(code_str)
        if not is_valid:
            return False, "", {}, validation_err, 0.0

        # Setup standard output buffer
        stdout_buf = io.StringIO()
        
        # Restricted safe builtins
        safe_builtins = {
            'print': print,
            'range': range,
            'len': len,
            'int': int,
            'float': float,
            'str': str,
            'list': list,
            'dict': dict,
            'set': set,
            'tuple': tuple,
            'round': round,
            'sum': sum,
            'min': min,
            'max': max,
            'abs': abs,
            'enumerate': enumerate,
            'zip': zip,
            'bool': bool,
            'any': any,
            'all': all,
            'map': map,
            'filter': filter,
            'sorted': sorted,
            'isinstance': isinstance,
            'type': type,
        }

        # Scope definition (single shared dict for globals and locals so list comprehensions & f-strings access variables)
        scope = {
            "__builtins__": safe_builtins,
            "df": df.copy(),
            "pd": pd,
            "np": np,
            "math": math,
            "ui_component": None,
            "speech_text": None
        }

        try:
            with contextlib.redirect_stdout(stdout_buf):
                # Execute in the restricted sandbox environment with shared globals/locals
                exec(code_str, scope, scope)
                
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            stdout_output = stdout_buf.getvalue()
            return True, stdout_output, scope, None, round(elapsed_ms, 2)
            
        except Exception as e:
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            stdout_output = stdout_buf.getvalue()
            return False, stdout_output, scope, str(e), round(elapsed_ms, 2)

python_executor = PythonExecutor()

