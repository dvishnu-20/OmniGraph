import os
import time
import sqlite3
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, Optional, List
from sqlalchemy import create_engine, inspect, text

class DatabaseConnector:
    """Manages connection pools, schema introspection, and SQL query execution for enterprise databases."""
    
    def __init__(self):
        self.engine = None
        self.active_db_url: str = ""
        self.db_type: str = "sqlite"
        self.active_db_name: str = "enterprise_data.db"
        self._ensure_sample_sqlite_db()

    def _ensure_sample_sqlite_db(self) -> str:
        """Create a sample pre-populated SQLite database with customers, orders, and products tables if needed."""
        samples_dir = os.path.join(os.path.dirname(__file__), "samples")
        os.makedirs(samples_dir, exist_ok=True)
        db_path = os.path.abspath(os.path.join(samples_dir, "enterprise_data.db"))
        
        # Connect & populate if database is new
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS customers (
            customer_id INTEGER PRIMARY KEY,
            customer_name TEXT NOT NULL,
            segment TEXT,
            country TEXT,
            credit_limit REAL
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            product_id INTEGER PRIMARY KEY,
            product_name TEXT NOT NULL,
            category TEXT,
            unit_price REAL
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            order_id INTEGER PRIMARY KEY,
            customer_id INTEGER,
            product_id INTEGER,
            order_date TEXT,
            quantity INTEGER,
            total_amount REAL,
            region TEXT,
            FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
            FOREIGN KEY (product_id) REFERENCES products(product_id)
        );
        """)

        # Insert sample records if tables are empty
        cursor.execute("SELECT COUNT(*) FROM customers")
        if cursor.fetchone()[0] == 0:
            customers_data = [
                (101, 'Acme Corp', 'Enterprise', 'USA', 150000.0),
                (102, 'Global Logistics', 'Mid-Market', 'Germany', 85000.0),
                (103, 'Starlight Tech', 'Enterprise', 'USA', 200000.0),
                (104, 'Nexus Retail', 'SMB', 'UK', 45000.0),
                (105, 'Horizon Energy', 'Enterprise', 'Canada', 175000.0),
                (106, 'Apex Media', 'SMB', 'France', 35000.0)
            ]
            cursor.executemany("INSERT INTO customers VALUES (?,?,?,?,?)", customers_data)

            products_data = [
                (1, 'Enterprise Cloud Server', 'Infrastructure', 2499.0),
                (2, 'AI Analytics Suite', 'Software', 1299.0),
                (3, 'Database Connector Pro', 'Software', 499.0),
                (4, 'Security Shield License', 'Security', 899.0),
                (5, 'Dedicated Storage Node', 'Hardware', 3199.0)
            ]
            cursor.executemany("INSERT INTO products VALUES (?,?,?,?)", products_data)

            orders_data = [
                (1001, 101, 1, '2024-01-15', 5, 12495.0, 'North America'),
                (1002, 101, 2, '2024-02-10', 10, 12990.0, 'North America'),
                (1003, 102, 3, '2024-01-20', 8, 3992.0, 'Europe'),
                (1004, 103, 1, '2024-02-01', 12, 29988.0, 'North America'),
                (1005, 103, 4, '2024-02-18', 15, 13485.0, 'North America'),
                (1006, 104, 3, '2024-01-28', 4, 1996.0, 'Europe'),
                (1007, 105, 5, '2024-02-12', 6, 19194.0, 'North America'),
                (1008, 106, 2, '2024-02-25', 3, 3897.0, 'Europe')
            ]
            cursor.executemany("INSERT INTO orders VALUES (?,?,?,?,?,?,?)", orders_data)

        conn.commit()
        conn.close()

        if self.engine is None:
            self.active_db_url = f"sqlite:///{db_path}"
            self.engine = create_engine(self.active_db_url)
            self.db_type = "sqlite"
            self.active_db_name = "enterprise_data.db (Sample SQLite)"

        return db_path

    def connect(self, db_url_or_path: str) -> Dict[str, Any]:
        """Connect to custom database URL (postgresql, mysql, sqlite) or file path."""
        try:
            if not db_url_or_path.startswith(('sqlite:', 'postgresql:', 'mysql:', 'snowflake:')):
                if os.path.exists(db_url_or_path):
                    db_url = f"sqlite:///{os.path.abspath(db_url_or_path)}"
                else:
                    db_url = f"sqlite:///{db_url_or_path}"
            else:
                db_url = db_url_or_path

            engine = create_engine(db_url)
            # Test connection
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))

            self.engine = engine
            self.active_db_url = db_url
            self.db_type = db_url.split(":")[0]
            self.active_db_name = os.path.basename(db_url.split("?")[0]) or self.db_type
            
            return {
                "success": True,
                "message": f"Successfully connected to {self.db_type.upper()} database",
                "schema": self.get_schema_summary()
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Database Connection Error: {str(e)}"
            }

    def get_schema_summary(self) -> Dict[str, Any]:
        """Inspect all tables, column names, dtypes, and record counts."""
        if self.engine is None:
            self._ensure_sample_sqlite_db()

        inspector = inspect(self.engine)
        table_names = inspector.get_table_names()
        
        tables_info = {}
        for table in table_names:
            columns = inspector.get_columns(table)
            col_details = {c['name']: str(c['type']) for c in columns}
            
            # Fetch row count
            row_count = 0
            try:
                with self.engine.connect() as conn:
                    res = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    row_count = res.scalar()
            except Exception:
                pass

            tables_info[table] = {
                "columns": col_details,
                "row_count": row_count
            }

        return {
            "db_name": self.active_db_name,
            "db_type": self.db_type,
            "tables": tables_info,
            "table_count": len(table_names)
        }

    def execute_sql(self, sql_query: str) -> Tuple[bool, str, Optional[pd.DataFrame], Dict[str, Any], Optional[str], float]:
        """
        Executes a SELECT SQL query securely.
        Returns: (success, stdout, df, local_vars, error_msg, execution_time_ms)
        """
        start_time = time.perf_counter()
        
        if self.engine is None:
            self._ensure_sample_sqlite_db()

        # Security check: Disallow destructive queries (DROP, DELETE, UPDATE, INSERT, ALTER)
        sql_clean = sql_query.strip().upper()
        forbidden_keywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE', 'GRANT', 'REVOKE']
        for keyword in forbidden_keywords:
            if sql_clean.startswith(keyword) or f" {keyword} " in f" {sql_clean} ":
                elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                return False, "", None, {}, f"Security Restriction: Write/mutation query '{keyword}' is blocked in SQL read-only mode.", round(elapsed_ms, 2)

        try:
            with self.engine.connect() as conn:
                df = pd.read_sql_query(text(sql_query), conn)

            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            stdout_msg = f"SQL query executed successfully returning {len(df)} rows and {len(df.columns)} columns."
            
            return True, stdout_msg, df, {"df": df}, None, round(elapsed_ms, 2)

        except Exception as e:
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            return False, "", None, {}, str(e), round(elapsed_ms, 2)

db_connector = DatabaseConnector()
