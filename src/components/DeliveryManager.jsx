import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext"; 
import axios from "axios";
import API_BASE_URL from "../config";
import "../styles/DeliveryManager.css";

const DeliveryManager = () => {
  const { user } = useContext(AuthContext); 
  const [warehouseId, setWarehouseId] = useState("");
  const [warehouseName, setWarehouseName] = useState("");
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [warehouses, setWarehouses] = useState([]); 
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [employmentType, setEmploymentType] = useState("Full-time");
  const [shiftTimings, setShiftTimings] = useState("9:00 AM - 6:00 PM");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [editingEmployee, setEditingEmployee] = useState(null);
  const [supervisor, setSupervisor] = useState("No");

  // Fetch all delivery employees
  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/deliveryEmployees`);
      const deliveryEmployees = res.data.filter(user => user.role === "deliveryEmployee");
      setEmployees(deliveryEmployees);
      
      // Filter employees based on current warehouse
      filterEmployeesByWarehouse(deliveryEmployees, warehouseName);
    } catch (err) {
      console.error("Error fetching employees:", err.response || err);
    }
  };

  // Filter employees by warehouse name
  const filterEmployeesByWarehouse = (employeesList, currentWarehouseName) => {
    if (!currentWarehouseName) {
      setFilteredEmployees(employeesList);
      return;
    }

    const filtered = employeesList.filter(emp => 
      emp.warehouseName === currentWarehouseName || 
      emp.deliveryEmployee?.warehouseName === currentWarehouseName
    );
    setFilteredEmployees(filtered);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    // Filter employees whenever warehouse name changes
    filterEmployeesByWarehouse(employees, warehouseName);
  }, [warehouseName, employees]);

  const handleActivateEmployee = async (email, securityKey) => {
    const password = window.prompt("Enter a temporary password for the employee:");
    if (!password) return;

    try {
      const res = await axios.post(`${API_BASE_URL}/api/deliveryEmployees/activate`, {
        email,
        securityKey,
        password
      });
      setMessage(res.data.message);
      fetchEmployees(); // refresh list
    } catch (err) {
      setMessage(err.response?.data?.message || "Error activating employee");
    }
  };

  // Create new delivery employee
  const handleCreateEmployee = async () => {
    if (!name || !email || !vehicleNumber) {
      setMessage("All fields are required!");
      return;
    }

    if (!warehouseId || !warehouseName) {
      setMessage("Warehouse information is required!");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/deliveryEmployees/create`, {
        name,
        email,
        role: "deliveryEmployee",
        warehouseId,
        warehouseName, 
        vehicleNumber, 
        employmentType,
        shiftTimings,
        supervisor  
      });
      setMessage(res.data.message);
      setName(""); 
      setEmail(""); 
      setVehicleNumber("");
      fetchEmployees();
    } catch (err) {
      setMessage(err.response?.data?.message || "Error creating employee");
    }
    setLoading(false);
  };

  // Delete employee
  const handleDeleteEmployee = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/deliveryEmployees/delete/${id}`);
      setMessage(res.data.message);
      fetchEmployees();
    } catch (err) {
      setMessage(err.response?.data?.message || "Error deleting employee");
    }
  };

  // Start editing employee
  const handleEditEmployee = (emp) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setEmail(emp.email);
    setVehicleNumber(emp.deliveryEmployee?.vehicleNumber || "");
    setEmploymentType(emp.deliveryEmployee?.employmentType || "Full-time");
    setShiftTimings(emp.deliveryEmployee?.shiftTimings || "9:00 AM - 6:00 PM");
    setSupervisor(emp.deliveryEmployee?.supervisor || "No");
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingEmployee(null);
    setName(""); 
    setEmail(""); 
    setVehicleNumber("");
  };

  // Update employee
  const handleUpdateEmployee = async () => {
    if (!name || !email || !vehicleNumber) {
      setMessage("All fields are required!");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.put(`${API_BASE_URL}/api/deliveryEmployees/update/${editingEmployee._id}`, {
        name,
        email,
        vehicleNumber,
        employmentType,
        shiftTimings,
        supervisor 
      });
      setMessage(res.data.message);
      setEditingEmployee(null);
      setName(""); 
      setEmail(""); 
      setVehicleNumber("");
      fetchEmployees();
    } catch (err) {
      setMessage(err.response?.data?.message || "Error updating employee");
    }
    setLoading(false);
  };

  const handleBackToSite = () => {
    window.history.back();
  };

  useEffect(() => {
    // 1️⃣ Try getting warehouseId and name from user context
    let id = user?.warehouse?._id || "";
    let name = user?.warehouse?.name || "";

    // 2️⃣ If not available, try getting from sessionStorage
    if (!id) {
      const storedId = sessionStorage.getItem("warehouseId");
      if (storedId) id = storedId;
    }
    if (!name) {
      const storedName = sessionStorage.getItem("warehouseName");
      if (storedName) name = storedName;
    }

    // 3️⃣ Set state
    setWarehouseId(id);
    setWarehouseName(name);

    // 4️⃣ Store in sessionStorage for future use
    if (id) sessionStorage.setItem("warehouseId", id);
    if (name) sessionStorage.setItem("warehouseName", name);

    console.log("✅ DeliveryManager warehouseId:", id, "warehouseName:", name);
  }, [user]);

  return (
    <div className="delivery-manager-container">
      {/* Back to Site Button */}
      <div className="delivery-manager-nav">
        <button className="delivery-back-btn" onClick={handleBackToSite}>
          <i className="fas fa-arrow-left"></i>
          Back to Site
        </button>
      </div>

      <h2 className="delivery-manager-title">Delivery Employees Management</h2>

      {message && (
        <div className={`delivery-alert ${message.includes("Error") ? "delivery-alert-error" : "delivery-alert-success"}`}>
          {message}
        </div>
      )}

      {/* Warehouse Info Display */}
      {warehouseName && (
        <div className="warehouse-display-section">
          <div className="warehouse-info-badge">
            <i className="fas fa-warehouse"></i>
            Warehouse: <strong>{warehouseName}</strong>
            {warehouseId && <span className="warehouse-id">ID: {warehouseId}</span>}
          </div>
          <div className="warehouse-filter-info">
            Showing employees assigned to: <strong>{warehouseName}</strong>
          </div>
        </div>
      )}

      {/* Form Section */}
      <div className="delivery-form-container">
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="delivery-form-input"
        />
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="delivery-form-input"
        />
        <input
          type="text"
          placeholder="Vehicle Number"
          value={vehicleNumber}
          onChange={e => setVehicleNumber(e.target.value)}
          className="delivery-form-input"
        />

        <input
            type="text"
            value={warehouseName || ""}
            readOnly
            placeholder="Warehouse Name"
            className="delivery-form-input"
            disabled
          />
          <input
            type="text"
            value={warehouseId || ""}
            readOnly
            placeholder="Warehouse ID"
            className="delivery-form-input"
            disabled
          />

        {/* Employment Type */}
        <select
          name="employmentType"
          value={employmentType || "Full-time"}
          onChange={e => setEmploymentType(e.target.value)}
          className="delivery-form-input"
        >
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
        </select>

        {/* Shift Timings */}
        <select
          name="shiftTimings"
          value={shiftTimings || "9:00 AM - 6:00 PM"}
          onChange={e => setShiftTimings(e.target.value)}
          className="delivery-form-input"
        >
          <option value="9:00 AM - 6:00 PM">9:00 AM - 6:00 PM</option>
          <option value="9:00 AM - 1:00 PM">9:00 AM - 1:00 PM</option>
          <option value="1:00 PM - 6:00 PM">1:00 PM - 6:00 PM</option>
        </select>
        
        {/* Supervisor */}
        <select
          name="supervisor"
          value={supervisor}
          onChange={e => setSupervisor(e.target.value)}
          className="delivery-form-input"
        >
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>

        {/* Create / Update Button */}
        <div className="delivery-form-actions">
          {editingEmployee ? (
            <>
              <button onClick={handleUpdateEmployee} disabled={loading} className="delivery-update-btn">
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Updating Employee...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Update Employee
                  </>
                )}
              </button>
              <button onClick={handleCancelEdit} className="delivery-cancel-btn">
                <i className="fas fa-times"></i>
                Cancel
              </button>
            </>
          ) : (
            <button onClick={handleCreateEmployee} disabled={loading} className="delivery-submit-btn">
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Creating Employee...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus"></i>
                  Create Employee
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Employees List */}
      <div className="delivery-employees-section">
        <h3 className="delivery-section-title" id="head">
          <i className="fas fa-users"></i>
          Existing Delivery Employees for {warehouseName || "Current Warehouse"}
        </h3>

        {filteredEmployees.length === 0 ? (
          <div className="delivery-empty-state">
            <i className="fas fa-users delivery-empty-icon"></i>
            <span className="delivery-empty-text">
              {warehouseName 
                ? `No delivery employees found for ${warehouseName} warehouse`
                : "No delivery employees found"
              }
            </span>
            {warehouseName && (
              <div className="empty-state-hint">
                Create a new delivery employee above to get started.
              </div>
            )}
          </div>
        ) : (
          <div className="delivery-employees-grid">
            {filteredEmployees.map(emp => (
              <div
                key={emp._id}
                className={`delivery-employee-card ${emp.deliveryEmployee?.isActive ? 'card-active' : 'card-inactive'}`}
              >
                <div className="delivery-card-header">
                  <div className="delivery-employee-avatar">
                    <i className="fas fa-user"></i>
                  </div>
                  <div className="delivery-employee-basic-info">
                    <h4 className="delivery-employee-name">{emp.name}</h4>
                    <p className="delivery-employee-email">
                      <i className="fas fa-envelope"></i>
                      {emp.email}
                    </p>
                  </div>
                  <div className="delivery-header-actions">
                    <div className={`delivery-status-badge ${emp.deliveryEmployee?.isActive ?? false ? "status-active" : "status-inactive"}`}>
                      <i className={`fas ${emp.deliveryEmployee?.isActive ?? false ? "fa-check-circle" : "fa-times-circle"}`}></i>
                      {emp.deliveryEmployee?.isActive ?? false ? "Active" : "Inactive"}
                    </div>
                  </div>
                </div>

                <div className="delivery-card-body">
                  <div className="delivery-info-grid">
                    {/* Vehicle */}
                    <div className="delivery-info-item">
                      <div className="delivery-info-icon">
                        <i className="fas fa-motorcycle"></i>
                      </div>
                      <div className="delivery-info-content">
                        <span className="delivery-info-label">Vehicle</span>
                        <span className="delivery-info-value">
                          {emp.deliveryEmployee?.vehicleNumber || "Not assigned"}
                        </span>
                      </div>
                    </div>

                    {/* Warehouse Name */}
                    <div className="delivery-info-item">
                      <div className="delivery-info-icon">
                        <i className="fas fa-warehouse"></i>
                      </div>
                      <div className="delivery-info-content">
                        <span className="delivery-info-label">Warehouse</span>
                        <span className="delivery-info-value">
                          {emp.warehouseName || emp.deliveryEmployee?.warehouseName || "Not assigned"}
                        </span>
                      </div>
                    </div>

                    {/* Role */}
                    <div className="delivery-info-item">
                      <div className="delivery-info-icon">
                        <i className="fas fa-user-tag"></i>
                      </div>
                      <div className="delivery-info-content">
                        <span className="delivery-info-label">Role</span>
                        <span className="delivery-info-value delivery-role-badge">
                          {emp.role}
                        </span>
                      </div>
                    </div>

                    {/* Joined Date */}
                    <div className="delivery-info-item">
                      <div className="delivery-info-icon">
                        <i className="fas fa-calendar"></i>
                      </div>
                      <div className="delivery-info-content">
                        <span className="delivery-info-label">Joined Date</span>
                        <span className="delivery-info-value">
                          {emp.deliveryEmployee?.joinedDate
                            ? new Date(emp.deliveryEmployee.joinedDate).toLocaleDateString()
                            : "Not available"}
                        </span>
                      </div>
                    </div>

                    {/* Employee Type */}
                    <div className="delivery-info-item">
                      <div className="delivery-info-icon">
                        <i className="fas fa-id-badge"></i>
                      </div>
                      <div className="delivery-info-content">
                        <span className="delivery-info-label">Employee Type</span>
                        <span className="delivery-info-value">
                          {emp.deliveryEmployee?.employmentType || "Full-time"}
                        </span>
                      </div>
                    </div>

                    {/* Shift Timings */}
                    <div className="delivery-info-item">
                      <div className="delivery-info-icon">
                        <i className="fas fa-clock"></i>
                      </div>
                      <div className="delivery-info-content">
                        <span className="delivery-info-label">Shift Timings</span>
                        <span className="delivery-info-value">
                          {emp.deliveryEmployee?.shiftTimings || "9:00 AM - 6:00 PM"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="delivery-card-footer">
                  <div className="delivery-footer-content">
                    <div className="delivery-employee-id">
                      <i className="fas fa-fingerprint"></i>
                      ID: {emp.deliveryEmployee?.employeeId || "N/A"}
                    </div>

                    <div className="delivery-action-buttons">
                      {/* Edit Button */}
                      <button
                        className="delivery-edit-btn"
                        onClick={() => handleEditEmployee(emp)}
                        title="Edit Employee"
                      >
                        <i className="fas fa-edit"></i>
                        <span>Edit</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        className="delivery-delete-btn"
                        onClick={() => handleDeleteEmployee(emp._id)}
                        title="Delete Employee"
                      >
                        <i className="fas fa-trash"></i>
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryManager;